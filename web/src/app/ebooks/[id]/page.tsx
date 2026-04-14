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

  const saveDebounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRestoredRef = useRef(false);
  const renditionRef        = useRef<any>(null);
  const isFirstLocationRef  = useRef(true);
  const currentLocationRef  = useRef<string | number>(0);
  const readerContainerRef  = useRef<HTMLDivElement>(null);
  const iframeBoundsRef     = useRef<ClipBounds | null>(null);
  // 클릭/스와이프 시 이미 애니메이션이 트리거됐는지 추적 (locationChanged 중복 방지)
  const flipFiredRef        = useRef(false);
  const touchStartXRef      = useRef(0);

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
  }, []);

  // iframe 바운드를 클릭 시점에 계산해서 캐시 (DOM이 안정된 시점)
  function cacheIframeBounds() {
    if (!readerContainerRef.current) return;
    const iframe = readerContainerRef.current.querySelector('iframe') as HTMLElement | null;
    if (!iframe) return;
    const ir = iframe.getBoundingClientRect();
    const pr = readerContainerRef.current.getBoundingClientRect();
    iframeBoundsRef.current = {
      x: ir.left - pr.left,
      y: ir.top  - pr.top,
      w: ir.width,
      h: ir.height,
    };
  }

  // 애니메이션 트리거 — 클릭/스와이프 시 현재 페이지 위에서 즉시 시작
  function triggerFlip(dir: 'forward' | 'backward') {
    if (flipFiredRef.current) return; // 이미 진행 중
    flipFiredRef.current = true;
    cacheIframeBounds();
    setFlipDir(dir);
  }

  // 버튼 클릭 처리: reader container의 좌/우 엣지 클릭을 감지
  function handleReaderPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    // ReactReader 화살표 버튼 영역 (~64px 좌우 엣지)
    if (x < 64) triggerFlip('backward');
    else if (x > w - 64) triggerFlip('forward');
  }

  // 스와이프 처리
  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(dx) > 40) {
      triggerFlip(dx < 0 ? 'forward' : 'backward');
    }
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
        </div>
      </header>

      {/* Reader with page-flip overlay
          min-h-0: flex-1 child가 overflow하지 않도록 강제
          overflow-hidden: canvas가 header/footer 영역으로 삐져나가는 것 차단 */}
      <div
        ref={readerContainerRef}
        className="flex-1 min-h-0 overflow-hidden relative"
        onPointerDown={handleReaderPointerDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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

        {/* Canvas 페이지 넘김 애니메이션
            clipBounds: debounce 후 계산된 iframe 실제 영역
            inset:0 + 부모 overflow:hidden 으로 2중 경계 보장 */}
        {flipDir && (
          <PageTurnCanvas
            direction={flipDir}
            clipBounds={iframeBoundsRef.current}
            onDone={() => { flipFiredRef.current = false; setFlipDir(null); }}
          />
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
