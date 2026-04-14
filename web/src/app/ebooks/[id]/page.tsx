'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { useAuthStore } from '@/store/auth.store';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

interface ClipBounds { x: number; y: number; w: number; h: number; }

// ── Canvas-based page-turn animation ─────────────────────────────────────────
// clipBounds: epub 흰 콘텐츠 영역 (iframe bounds). null이면 전체 캔버스 사용.
// 색상: epub 흰 배경(#fff)과 동일하게 맞춰 자연스럽게 합성.
function PageTurnCanvas({ onDone, direction, clipBounds }: {
  onDone: () => void;
  direction: 'forward' | 'backward';
  clipBounds: ClipBounds | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // epub iframe 실제 영역에만 그린다
    const cx = clipBounds?.x  ?? 0;
    const cy = clipBounds?.y  ?? 0;
    const cw = clipBounds?.w  ?? W;
    const ch = clipBounds?.h  ?? H;

    const DURATION = 500;
    const start = performance.now();
    let rafId: number;

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function draw(now: number) {
      const raw = Math.min((now - start) / DURATION, 1);
      const t   = easeInOut(raw);

      // forward: 오른쪽→왼쪽 / backward: 왼쪽→오른쪽
      // fold 위치는 클리핑 영역 안에서 계산
      const foldX = cx + (direction === 'forward' ? cw * (1 - t) : cw * t);

      ctx.clearRect(0, 0, W, H);

      // epub 콘텐츠 영역 밖으로 그림 나가지 않도록 clip
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cw, ch);
      ctx.clip();

      if (direction === 'forward') {
        if (foldX > cx) {
          // 페이지 면 — epub 흰 배경과 동일한 흰색
          const pg = ctx.createLinearGradient(cx, 0, foldX, 0);
          pg.addColorStop(0,    'rgba(255, 255, 255, 0.97)');
          pg.addColorStop(0.85, 'rgba(255, 255, 255, 0.97)');
          pg.addColorStop(1,    'rgba(220, 220, 220, 0.98)');
          ctx.fillStyle = pg;
          ctx.fillRect(cx, cy, foldX - cx, ch);

          // fold 그림자
          const foldW = Math.min(80, foldX - cx);
          const fs = ctx.createLinearGradient(foldX - foldW, 0, foldX, 0);
          fs.addColorStop(0,   'rgba(0,0,0,0)');
          fs.addColorStop(0.6, 'rgba(0,0,0,0.07)');
          fs.addColorStop(1,   'rgba(0,0,0,0.38)');
          ctx.fillStyle = fs;
          ctx.fillRect(Math.max(cx, foldX - foldW), cy, foldW, ch);

          // cast shadow (접힌 선 오른쪽)
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
          // 페이지 면 — 흰색
          const pg = ctx.createLinearGradient(foldX, 0, cx + cw, 0);
          pg.addColorStop(0,    'rgba(220, 220, 220, 0.98)');
          pg.addColorStop(0.15, 'rgba(255, 255, 255, 0.97)');
          pg.addColorStop(1,    'rgba(255, 255, 255, 0.97)');
          ctx.fillStyle = pg;
          ctx.fillRect(foldX, cy, cx + cw - foldX, ch);

          // fold 그림자
          const foldW = Math.min(80, cx + cw - foldX);
          const fs = ctx.createLinearGradient(foldX, 0, foldX + foldW, 0);
          fs.addColorStop(0,   'rgba(0,0,0,0.38)');
          fs.addColorStop(0.4, 'rgba(0,0,0,0.07)');
          fs.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = fs;
          ctx.fillRect(foldX, cy, foldW, ch);

          // cast shadow (접힌 선 왼쪽)
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
        onDone();
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [onDone, direction, clipBounds]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
    />
  );
}

interface EbookMeta {
  id: string;
  title: string;
  description: string | null;
  isFree: boolean;
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

  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [meta, setMeta] = useState<EbookMeta | null>(null);
  const [location, setLocation] = useState<string | number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(true);
  const [fontSize, setFontSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [flipDir, setFlipDir] = useState<'forward' | 'backward' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [flipEnabled, setFlipEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('ebook-flip-enabled') !== 'false';
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDebounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRestoredRef = useRef(false);
  const renditionRef        = useRef<any>(null);
  const isFirstLocationRef  = useRef(true);
  const currentLocationRef  = useRef<string | number>(0);
  const readerContainerRef  = useRef<HTMLDivElement>(null);
  const iframeBoundsRef     = useRef<ClipBounds | null>(null);
  // rendition 패치에서 호출하는 안정적인 트리거 ref (stale closure 방지)
  const flipTriggerRef      = useRef<(dir: 'forward' | 'backward') => void>(() => {});
  // 애니메이션 진행 중 여부 — 중복 트리거 방지
  const isAnimatingRef      = useRef(false);

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
            if (savedCfi) {
              setLocation(savedCfi);
              progressRestoredRef.current = true;
            }
          }
        } catch {}

        const fileRes = await fetch(`${API_BASE}/api/v1/ebooks/${id}/file`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!fileRes.ok) {
          const body = await fileRes.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? 'EPUB 파일을 불러올 수 없습니다.');
        }
        const buf = await fileRes.arrayBuffer();
        setEpubData(buf);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsFileLoading(false);
      }
    }

    loadEbook();
  }, [token, id]);

  // Apply font size whenever it changes
  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  // Sync page counter when locations finish generating
  useEffect(() => {
    if (totalPages === 0) return;
    const cfi = renditionRef.current?.location?.start?.cfi ?? currentLocationRef.current;
    if (typeof cfi === 'string') {
      const pageNum = renditionRef.current?.book?.locations?.locationFromCfi(cfi);
      if (pageNum >= 0) setCurrentPage(pageNum + 1);
    }
  }, [totalPages]);

  // flipTriggerRef.current를 매 렌더마다 최신 상태로 갱신
  // handleGetRendition은 빈 dep로 고정되므로 ref를 통해 최신값 전달
  useEffect(() => {
    flipTriggerRef.current = (dir: 'forward' | 'backward') => {
      // 애니메이션 진행 중이면 무시 (중복 트리거 차단)
      if (isAnimatingRef.current) return;

      if (dir === 'backward' && currentPage <= 1) {
        showToast('첫 페이지입니다');
        return;
      }
      if (dir === 'forward' && totalPages > 0 && currentPage >= totalPages) {
        showToast('마지막 페이지입니다');
        return;
      }
      if (!flipEnabled) return;

      isAnimatingRef.current = true;
      cacheIframeBounds();
      setFlipDir(dir);
    };
  });

  const handleGetRendition = useCallback((rendition: any) => {
    renditionRef.current = rendition;

    rendition.themes.fontSize(`${fontSize}%`);

    const SELECTION_CSS = `
      html body *::selection { background: rgba(74, 158, 255, 0.35) !important; color: inherit !important; }
      html body *::-moz-selection { background: rgba(74, 158, 255, 0.35) !important; color: inherit !important; }
      * { -webkit-tap-highlight-color: rgba(74, 158, 255, 0.2) !important; }
      a:link, a:visited, a:hover, a:active { color: inherit !important; text-decoration: none !important; }
    `;

    function injectStyle(contents: any) {
      const doc = contents?.document;
      if (!doc) return;
      if (doc.getElementById('cc-selection-style')) return;
      const style = doc.createElement('style');
      style.id = 'cc-selection-style';
      style.innerHTML = SELECTION_CSS;
      (doc.body ?? doc.head)?.appendChild(style);
    }

    rendition.hooks.content.register(injectStyle);
    rendition.getContents().forEach(injectStyle);

    rendition.book.ready.then(() => {
      rendition.book.locations.generate(1024).then(() => {
        setTotalPages(rendition.book.locations.length());
      });
    });

    // rendition.next / prev 를 패치해 페이지 넘김 효과를 단일 진입점에서 처리
    // (ReactReader 화살표 버튼, 키보드, epub.js 스와이프 모두 여기를 통과)
    const origNext = rendition.next.bind(rendition);
    const origPrev = rendition.prev.bind(rendition);
    rendition.next = () => {
      flipTriggerRef.current('forward');
      const p = origNext();
      // epub 이동 실패 시 isAnimatingRef 잠금 해제
      Promise.resolve(p).catch(() => { isAnimatingRef.current = false; setFlipDir(null); });
      return p;
    };
    rendition.prev = () => {
      flipTriggerRef.current('backward');
      const p = origPrev();
      Promise.resolve(p).catch(() => { isAnimatingRef.current = false; setFlipDir(null); });
      return p;
    };
  }, []);

  // epub 흰 콘텐츠 영역을 정확히 계산
  // iframe.contentDocument.body 기준 → 실제 흰 페이지 영역만 클리핑
  function cacheIframeBounds() {
    if (!readerContainerRef.current) return;
    const iframe = readerContainerRef.current.querySelector('iframe') as HTMLIFrameElement | null;
    if (!iframe) return;

    const pr = readerContainerRef.current.getBoundingClientRect();
    const ir = iframe.getBoundingClientRect();

    // epub body 경계: iframe 뷰포트 기준 → 메인 뷰포트 기준으로 변환
    try {
      const body = iframe.contentDocument?.body;
      if (body) {
        const br = body.getBoundingClientRect(); // iframe 내부 뷰포트 기준
        const x = ir.left + br.left - pr.left;
        const y = ir.top  + br.top  - pr.top;
        const w = br.width;
        const h = br.height;
        if (w > 0 && h > 0) {
          iframeBoundsRef.current = { x, y, w, h };
          return;
        }
      }
    } catch {}

    // 폴백: iframe 엘리먼트 경계
    iframeBoundsRef.current = {
      x: ir.left - pr.left,
      y: ir.top  - pr.top,
      w: ir.width,
      h: ir.height,
    };
  }

  // 토스트 표시 (2초 후 자동 닫힘)
  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }

  const handleLocationChanged = useCallback((loc: string | number) => {
    // TOC href 형태 → rendition.display() 로 직접 이동
    if (typeof loc === 'string' && !loc.startsWith('epubcfi(')) {
      renditionRef.current?.display(loc);
      return;
    }

    currentLocationRef.current = loc;
    setLocation(loc);

    // 페이지 번호 업데이트만 담당 — 애니메이션은 pointerDown/touchEnd에서 처리
    if (typeof loc === 'string' && renditionRef.current) {
      const locs = renditionRef.current.book?.locations;
      if (locs?.length() > 0) {
        const pageNum = locs.locationFromCfi(loc);
        if (pageNum >= 0) setCurrentPage(pageNum + 1);
      }
    }

    if (isFirstLocationRef.current) {
      isFirstLocationRef.current = false;
      return;
    }

    // 진행 상황 저장
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

        {/* Font size controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeFontSize(-10)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-cc-muted hover:text-cc-text hover:bg-white/10 transition-colors text-base font-bold"
          >
            A−
          </button>
          <span className="text-sm text-cc-muted w-12 text-center font-mono">{fontSize}%</span>
          <button
            onClick={() => changeFontSize(10)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-cc-muted hover:text-cc-text hover:bg-white/10 transition-colors text-base font-bold"
          >
            A+
          </button>

          {/* 페이지 넘김 효과 토글 */}
          <button
            onClick={() => {
              const next = !flipEnabled;
              setFlipEnabled(next);
              localStorage.setItem('ebook-flip-enabled', String(next));
              showToast(next ? '넘김 효과 켜짐' : '넘김 효과 꺼짐');
            }}
            title={flipEnabled ? '넘김 효과 끄기' : '넘김 효과 켜기'}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-lg ${
              flipEnabled
                ? 'text-cc-accent hover:bg-white/10'
                : 'text-cc-muted hover:bg-white/10'
            }`}
          >
            {flipEnabled ? '📖' : '📄'}
          </button>
        </div>
      </header>

      {/* Reader with page-flip overlay
          min-h-0: flex-1 child가 overflow하지 않도록 강제
          overflow-hidden: canvas가 header/footer 영역으로 삐져나가는 것 차단 */}
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
            arrow: { ...ReactReaderStyle.arrow, color: '#e2b84e' },
          }}
        />

        {/* Canvas 페이지 넘김 애니메이션 */}
        {flipDir && (
          <PageTurnCanvas
            direction={flipDir}
            clipBounds={iframeBoundsRef.current}
            onDone={() => { isAnimatingRef.current = false; setFlipDir(null); }}
          />
        )}

        {/* 첫/마지막 페이지 토스트 */}
        {toast && (
          <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none" style={{ zIndex: 20 }}>
            <div className="bg-black/70 text-white text-sm font-medium px-5 py-2.5 rounded-full backdrop-blur-sm animate-fade-in">
              {toast}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar: page indicator */}
      <div className="shrink-0 flex items-center justify-center py-3 bg-[#12122a] border-t border-white/10">
        <span className="text-sm font-medium text-cc-muted tracking-wide">
          {totalPages > 0 ? `${currentPage} / ${totalPages} 페이지` : '읽는 중...'}
        </span>
      </div>
    </div>
  );
}
