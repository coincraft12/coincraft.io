'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { useAuthStore } from '@/store/auth.store';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

interface ClipBounds { x: number; y: number; w: number; h: number; }

// ── Canvas-based page-turn animation ─────────────────────────────────────────
function PageTurnCanvas({ onDone, direction, clipBounds }: {
  onDone: () => void;
  direction: 'forward' | 'backward';
  clipBounds: ClipBounds | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    const parent = canvas.parentElement as HTMLElement;
    if (!parent) return;
    canvas.width  = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    const W = canvas.width;
    const H = canvas.height;

    // 경계 clamping — canvas 밖으로 절대 나가지 않도록
    const cx = Math.max(0, clipBounds?.x ?? 0);
    const cy = Math.max(0, clipBounds?.y ?? 0);
    const cw = Math.min(W - cx, clipBounds ? clipBounds.w : W);
    const ch = Math.min(H - cy, clipBounds ? clipBounds.h : H);

    const DURATION = 600;
    const start = performance.now();
    let rafId: number;

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function draw(now: number) {
      const raw = Math.min((now - start) / DURATION, 1);
      const t   = easeInOut(raw);
      const foldX = cx + (direction === 'forward' ? cw * (1 - t) : cw * t);

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cw, ch);
      ctx.clip();

      if (direction === 'forward') {
        if (foldX > cx) {
          const pg = ctx.createLinearGradient(cx, 0, foldX, 0);
          pg.addColorStop(0,    'rgba(255,255,255,0.97)');
          pg.addColorStop(0.85, 'rgba(255,255,255,0.97)');
          pg.addColorStop(1,    'rgba(220,220,220,0.98)');
          ctx.fillStyle = pg;
          ctx.fillRect(cx, cy, foldX - cx, ch);

          const foldW = Math.min(80, foldX - cx);
          const fs = ctx.createLinearGradient(foldX - foldW, 0, foldX, 0);
          fs.addColorStop(0,   'rgba(0,0,0,0)');
          fs.addColorStop(0.6, 'rgba(0,0,0,0.07)');
          fs.addColorStop(1,   'rgba(0,0,0,0.38)');
          ctx.fillStyle = fs;
          ctx.fillRect(Math.max(cx, foldX - foldW), cy, foldW, ch);

          const castW = Math.min(40, cx + cw - foldX);
          if (castW > 0) {
            const cs = ctx.createLinearGradient(foldX, 0, foldX + castW, 0);
            cs.addColorStop(0, 'rgba(0,0,0,0.20)');
            cs.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = cs;
            ctx.fillRect(foldX, cy, castW, ch);
          }
        }
      } else {
        if (foldX < cx + cw) {
          const pg = ctx.createLinearGradient(foldX, 0, cx + cw, 0);
          pg.addColorStop(0,    'rgba(220,220,220,0.98)');
          pg.addColorStop(0.15, 'rgba(255,255,255,0.97)');
          pg.addColorStop(1,    'rgba(255,255,255,0.97)');
          ctx.fillStyle = pg;
          ctx.fillRect(foldX, cy, cx + cw - foldX, ch);

          const foldW = Math.min(80, cx + cw - foldX);
          const fs = ctx.createLinearGradient(foldX, 0, foldX + foldW, 0);
          fs.addColorStop(0,   'rgba(0,0,0,0.38)');
          fs.addColorStop(0.4, 'rgba(0,0,0,0.07)');
          fs.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = fs;
          ctx.fillRect(foldX, cy, foldW, ch);

          const castW = Math.min(40, foldX - cx);
          if (castW > 0) {
            const cs = ctx.createLinearGradient(foldX - castW, 0, foldX, 0);
            cs.addColorStop(0, 'rgba(0,0,0,0)');
            cs.addColorStop(1, 'rgba(0,0,0,0.20)');
            ctx.fillStyle = cs;
            ctx.fillRect(foldX - castW, cy, castW, ch);
          }
        }
      }

      ctx.restore();

      if (raw < 1) {
        rafId = requestAnimationFrame(draw);
      } else {
        onDoneRef.current();
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
    />
  );
}

const PREVIEW_PAGE_LIMIT = 20;

interface EbookMeta {
  id: string;
  title: string;
  description: string | null;
  isFree: boolean;
  hasFullAccess: boolean;
  price: string;
}

interface EbookMetaResponse {
  success: boolean;
  data: EbookMeta;
}

export default function EbookViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const [epubData, setEpubData]       = useState<ArrayBuffer | null>(null);
  const [meta, setMeta]               = useState<EbookMeta | null>(null);
  const [location, setLocation]       = useState<string | number>(0);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(true);
  const [fontSize, setFontSize]       = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(0);
  const [flipDir, setFlipDir]         = useState<'forward' | 'backward' | null>(null);
  const [flipClipBounds, setFlipClipBounds] = useState<ClipBounds | null>(null);
  const [iframeOverlay, setIframeOverlay] = useState<{l:number;t:number;w:number;h:number}|null>(null);
  const [toast, setToast]             = useState<string | null>(null);
  const [showPaywall, setShowPaywall]   = useState(false);
  const [flipEnabled, setFlipEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('ebook-flip-enabled') !== 'false';
  });

  const toastTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFlipTimeRef     = useRef(0);
  const lastNavTimeRef      = useRef(0);
  const saveDebounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRestoredRef = useRef(false);
  const renditionRef        = useRef<any>(null);
  const isFirstLocationRef  = useRef(true);
  const currentLocationRef  = useRef<string | number>(0);
  const readerContainerRef  = useRef<HTMLDivElement>(null);
  const isAnimatingRef      = useRef(false);
  const prevPageRef         = useRef(0);
  const touchStartXRef      = useRef(0);
  // refs for values used inside stable callbacks
  const flipEnabledRef      = useRef(flipEnabled);
  const metaRef             = useRef<EbookMeta | null>(null);
  const setShowPaywallRef   = useRef(setShowPaywall);
  const totalPagesRef       = useRef(totalPages);
  const currentPageRef      = useRef(currentPage);

  useEffect(() => { flipEnabledRef.current    = flipEnabled; },   [flipEnabled]);
  useEffect(() => { totalPagesRef.current     = totalPages; },    [totalPages]);
  useEffect(() => { currentPageRef.current    = currentPage; },   [currentPage]);
  useEffect(() => { metaRef.current           = meta; },          [meta]);
  useEffect(() => { setShowPaywallRef.current = setShowPaywall; }, [setShowPaywall]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoading, token, router]);

  // Fetch meta + epub file
  useEffect(() => {
    if (!token || !id) return;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

    async function loadEbook() {
      setIsFileLoading(true);
      setLoadError(null);
      try {
        const metaRes = await fetch(`${API_BASE}/api/v1/ebooks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!metaRes.ok) {
          const body = await metaRes.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? '전자책 정보를 불러올 수 없습니다.');
        }
        const metaJson: EbookMetaResponse = await metaRes.json();
        setMeta(metaJson.data);

        try {
          const progressRes = await fetch(`${API_BASE}/api/v1/ebooks/${id}/progress`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (progressRes.ok) {
            const progressJson = await progressRes.json();
            const savedCfi = progressJson?.data?.lastCfi;
            if (savedCfi) { setLocation(savedCfi); progressRestoredRef.current = true; }
          }
        } catch {}

        const fileRes = await fetch(`${API_BASE}/api/v1/ebooks/${id}/file`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!fileRes.ok) {
          const body = await fileRes.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? 'EPUB 파일을 불러올 수 없습니다.');
        }
        setEpubData(await fileRes.arrayBuffer());
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsFileLoading(false);
      }
    }
    loadEbook();
  }, [token, id]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  useEffect(() => {
    if (totalPages === 0) return;
    const cfi = renditionRef.current?.location?.start?.cfi ?? currentLocationRef.current;
    if (typeof cfi === 'string') {
      const pageNum = renditionRef.current?.book?.locations?.locationFromCfi(cfi);
      if (pageNum >= 0) {
        setCurrentPage(pageNum + 1);
        prevPageRef.current = pageNum + 1;
      }
    }
  }, [totalPages]);

  // ── 토스트 ──────────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }

  // ── iframe 오버레이 동기화 — 2페이지 스프레드 포함 모든 iframe을 감싸는 박스
  const syncIframeOverlay = useCallback(() => {
    const container = readerContainerRef.current;
    if (!container) return;
    const iframes = Array.from(container.querySelectorAll('iframe'));
    if (iframes.length === 0) return;
    const cr = container.getBoundingClientRect();
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    iframes.forEach((f) => {
      const r = f.getBoundingClientRect();
      left   = Math.min(left,   r.left);
      top    = Math.min(top,    r.top);
      right  = Math.max(right,  r.right);
      bottom = Math.max(bottom, r.bottom);
    });
    const bounds = { l: left - cr.left, t: top - cr.top, w: right - left, h: bottom - top };
    setIframeOverlay(bounds);
    setFlipClipBounds({ x: bounds.l, y: bounds.t, w: bounds.w, h: bounds.h });
  }, []);

  // ── 애니메이션 시작 — 단일 진입점 ───────────────────────────────────────────
  function startFlip(dir: 'forward' | 'backward') {
    const now = Date.now();
    if (now - lastFlipTimeRef.current < 800) return;
    if (isAnimatingRef.current) return;
    if (!flipEnabledRef.current) return;

    lastFlipTimeRef.current = now;
    isAnimatingRef.current = true;
    setFlipDir(dir);

    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        setFlipDir(null);
      }
    }, 750);
  }

  // ── 렌디션 설정 ─────────────────────────────────────────────────────────────
  const handleGetRendition = useCallback((rendition: any) => {
    renditionRef.current = rendition;
    rendition.themes.fontSize(`${fontSize}%`);

    // epub.js 컨테이너를 전체 너비로 확장
    if (!document.getElementById('epub-fill-style')) {
      const s = document.createElement('style');
      s.id = 'epub-fill-style';
      s.textContent = '.epub-container{width:100%!important;left:0!important;margin:0!important;}';
      document.head.appendChild(s);
    }
    // 초기화 후 리사이즈 → 오버레이 동기화
    setTimeout(() => {
      const c = readerContainerRef.current;
      if (c) renditionRef.current?.resize(c.offsetWidth, c.offsetHeight);
      setTimeout(syncIframeOverlay, 50);
    }, 150);

    // 페이지 전환 후 오버레이 위치 재동기화
    rendition.on('rendered', () => setTimeout(syncIframeOverlay, 50));

    const SELECTION_CSS = `
      html body *::selection { background: rgba(74,158,255,0.35) !important; color: inherit !important; }
      html body *::-moz-selection { background: rgba(74,158,255,0.35) !important; color: inherit !important; }
      * { -webkit-tap-highlight-color: rgba(74,158,255,0.2) !important; }
      a:link, a:visited, a:hover, a:active { color: inherit !important; text-decoration: none !important; }
    `;
    function injectStyle(contents: any) {
      const doc = contents?.document;
      if (!doc || doc.getElementById('cc-selection-style')) return;
      const style = doc.createElement('style');
      style.id = 'cc-selection-style';
      style.innerHTML = SELECTION_CSS;
      (doc.body ?? doc.head)?.appendChild(style);
    }
    rendition.hooks.content.register(injectStyle);
    rendition.getContents().forEach(injectStyle);

    // epub.js 내부 클릭 내비게이션 차단 — 우리 overlay가 단독으로 처리
    // 원인: 2페이지 스프레드에서 우측 iframe의 좌반부 클릭 시
    //       overlay는 "combined 기준 오른쪽 = next()", epub.js는 "iframe 기준 왼쪽 = prev()" → 왔다갔다
    function injectNavBlock(contents: any) {
      const doc = contents?.document;
      if (!doc || (doc as any).__ccNavBlocked) return;
      (doc as any).__ccNavBlocked = true;
      doc.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('a[href]')) return; // epub 내부 링크는 허용
        e.stopImmediatePropagation();
        e.preventDefault();
      }, true); // capture phase — epub.js bubble 핸들러보다 먼저 실행
    }
    rendition.hooks.content.register(injectNavBlock);
    rendition.getContents().forEach(injectNavBlock);

    rendition.book.ready.then(() => {
      rendition.book.locations.generate(1024).then(() => {
        setTotalPages(rendition.book.locations.length());
      });
    });

    // 클릭 즉시 애니메이션 시작 (navigation 전) → epub.js 흰 화면 flash 가림
    const origNext = rendition.next.bind(rendition);
    const origPrev = rendition.prev.bind(rendition);
    rendition.next = () => {
      // 이중 호출 방지 — epub.js 내부 + overlay 동시 호출 시 두 번째는 무시
      const now = Date.now();
      if (now - lastNavTimeRef.current < 600) return Promise.resolve();
      lastNavTimeRef.current = now;

      if (currentPageRef.current >= totalPagesRef.current && totalPagesRef.current > 0) {
        showToast('마지막 페이지입니다');
        return Promise.resolve();
      }
      // 미리보기 페이지 제한 — hasFullAccess 없는 경우 20페이지 이후 차단
      if (!metaRef.current?.hasFullAccess && currentPageRef.current >= PREVIEW_PAGE_LIMIT) {
        setShowPaywallRef.current(true);
        return Promise.resolve();
      }
      startFlip('forward');
      return origNext();
    };
    rendition.prev = () => {
      // 이중 호출 방지
      const now = Date.now();
      if (now - lastNavTimeRef.current < 600) return Promise.resolve();
      lastNavTimeRef.current = now;

      if (currentPageRef.current <= 1) {
        showToast('첫 페이지입니다');
        return Promise.resolve();
      }
      startFlip('backward');
      return origPrev();
    };
  }, []);

  // ── 위치 변경 — 애니메이션 트리거 단일 경로 ─────────────────────────────────
  const handleLocationChanged = useCallback((loc: string | number) => {
    if (typeof loc === 'string' && !loc.startsWith('epubcfi(')) {
      renditionRef.current?.display(loc);
      return;
    }

    currentLocationRef.current = loc;
    setLocation(loc);

    if (typeof loc === 'string' && renditionRef.current) {
      const locs = renditionRef.current.book?.locations;
      if (locs?.length() > 0) {
        const pageNum = locs.locationFromCfi(loc) + 1;
        if (pageNum > 0) {
          prevPageRef.current = pageNum;
          setCurrentPage(pageNum);
        }
      }
    }

    if (isFirstLocationRef.current) {
      isFirstLocationRef.current = false;
      return;
    }

    if (!token || !id) return;
    if (!progressRestoredRef.current) { progressRestoredRef.current = true; return; }
    const cfi = typeof loc === 'string' ? loc : null;
    if (!cfi) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
      fetch(`${API_BASE}/api/v1/ebooks/${id}/progress`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cfi }),
      }).catch(() => {});
    }, 1000);
  }, [token, id]);

  function changeFontSize(delta: number) {
    setFontSize((prev) => Math.min(Math.max(prev + delta, 80), 160));
  }

  if (isAuthLoading || (!token && !isAuthLoading)) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isFileLoading) {
    return (
      <div className="min-h-screen bg-cc-primary flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-cc-muted text-sm">전자책을 불러오는 중...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-cc-primary flex flex-col items-center justify-center gap-4">
        <p className="text-5xl">📖</p>
        <p className="text-cc-text font-semibold">{loadError}</p>
        <Button variant="outline" onClick={() => router.push('/ebooks')}>전자책 목록으로</Button>
      </div>
    );
  }

  if (!epubData || !meta) return null;

  return (
    <div
      className="flex flex-col h-screen bg-[#1a1a2e] select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#12122a] border-b border-white/10 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => router.push('/ebooks')}>
          ← 목록
        </Button>

        <h1 className="text-cc-text text-sm font-semibold truncate max-w-[40%] text-center">
          {meta.title}
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => changeFontSize(-10)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-cc-muted hover:text-cc-text hover:bg-white/10 transition-colors text-base font-bold"
          >A−</button>
          <span className="text-sm text-cc-muted w-12 text-center font-mono">{fontSize}%</span>
          <button
            onClick={() => changeFontSize(10)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-cc-muted hover:text-cc-text hover:bg-white/10 transition-colors text-base font-bold"
          >A+</button>

          <button
            onClick={() => {
              const next = !flipEnabled;
              setFlipEnabled(next);
              localStorage.setItem('ebook-flip-enabled', String(next));
              showToast(next ? '넘김 효과 켜짐' : '넘김 효과 꺼짐');
            }}
            title={flipEnabled ? '넘김 효과 끄기' : '넘김 효과 켜기'}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-lg ${
              flipEnabled ? 'text-cc-accent hover:bg-white/10' : 'text-cc-muted hover:bg-white/10'
            }`}
          >
            {flipEnabled ? '📖' : '📄'}
          </button>
        </div>
      </header>

      <div
        ref={readerContainerRef}
        className="flex-1 min-h-0 overflow-hidden relative"
      >
        <ReactReader
          url={epubData}
          title={meta.title}
          location={location}
          locationChanged={handleLocationChanged}
          getRendition={handleGetRendition}
          readerStyles={{
            ...ReactReaderStyle,
            container: { ...ReactReaderStyle.container, background: '#1a1a2e' },
            readerArea: { ...ReactReaderStyle.readerArea, background: '#1a1a2e' },
            prev: { display: 'none' },
            next: { display: 'none' },
          }}
        />

        {/* 클릭/스와이프 오버레이 — iframe 위치에 딱 맞게 배치 (목차 버튼 등 외부 영역 제외) */}
        {iframeOverlay && (
          <div
            style={{
              position: 'absolute',
              left: iframeOverlay.l,
              top: iframeOverlay.t,
              width: iframeOverlay.w,
              height: iframeOverlay.h,
              zIndex: 5,
              cursor: 'pointer',
            }}
            onPointerDown={(e) => {
              touchStartXRef.current = e.clientX;
            }}
            onPointerUp={(e) => {
              const dx = e.clientX - touchStartXRef.current;
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              if (Math.abs(dx) > 30) {
                // 스와이프: 왼쪽 = 다음, 오른쪽 = 이전
                if (dx < 0) renditionRef.current?.next();
                else renditionRef.current?.prev();
              } else {
                // 탭: 오른쪽 절반 = 다음, 왼쪽 절반 = 이전
                if (e.clientX > rect.left + rect.width / 2) renditionRef.current?.next();
                else renditionRef.current?.prev();
              }
            }}
          />
        )}

        {/* 미리보기 종료 — 결제 유도 오버레이 */}
        {showPaywall && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30"
            style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(26,26,46,0.92) 30%, rgba(26,26,46,1) 60%)' }}
          >
            <div className="text-center space-y-5 px-6 max-w-sm">
              <p className="text-5xl">📖</p>
              <h2 className="text-xl font-bold text-cc-text">미리보기가 끝났습니다</h2>
              <p className="text-cc-muted text-sm leading-relaxed">
                {PREVIEW_PAGE_LIMIT}페이지까지 무료로 읽으실 수 있습니다.<br />
                전체 내용을 보려면 구매해주세요.
              </p>
              {meta && (
                <p className="text-cc-accent font-bold text-lg">{Number(meta.price).toLocaleString()}원</p>
              )}
              <div className="flex flex-col gap-3">
                <Button onClick={() => router.push(`/ebooks`)}>
                  구매하러 가기
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPaywall(false)}>
                  계속 읽기 (이전 페이지로)
                </Button>
              </div>
            </div>
          </div>
        )}

        {flipDir && (
          <PageTurnCanvas
            direction={flipDir}
            clipBounds={flipClipBounds}
            onDone={() => {
              if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
              isAnimatingRef.current = false;
              setFlipDir(null);
            }}
          />
        )}

        {toast && (
          <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none" style={{ zIndex: 20 }}>
            <div className="bg-black/70 text-white text-sm font-medium px-5 py-2.5 rounded-full backdrop-blur-sm animate-fade-in">
              {toast}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center justify-center py-3 bg-[#12122a] border-t border-white/10">
        <span className="text-sm font-medium text-cc-muted tracking-wide">
          {totalPages > 0 ? `${currentPage} / ${totalPages} 페이지` : '읽는 중...'}
        </span>
      </div>
    </div>
  );
}
