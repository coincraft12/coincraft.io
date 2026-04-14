'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { useAuthStore } from '@/store/auth.store';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

interface ClipBounds { clipX: number; clipY: number; clipW: number; clipH: number; }

// ── Canvas-based page-turn animation ─────────────────────────────────────────
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

    // 부모로부터 미리 계산된 iframe 클리핑 영역 사용 (매 애니메이션마다 DOM 쿼리 방지)
    const { clipX, clipY, clipW, clipH } = clipBounds ?? { clipX: 0, clipY: 0, clipW: W, clipH: H };

    const DURATION = 650;
    const start = performance.now();
    let rafId: number;

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function draw(now: number) {
      const raw = Math.min((now - start) / DURATION, 1);
      const t   = easeInOut(raw);

      // fold 위치는 클리핑 영역(clipW) 기준으로 계산
      // forward: 오른쪽→왼쪽 / backward: 왼쪽→오른쪽
      const foldX = clipX + (direction === 'forward' ? clipW * (1 - t) : clipW * t);

      ctx.clearRect(0, 0, W, H);

      // 클리핑: epub iframe 영역 바깥으로 그림이 나가지 않도록
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, clipY, clipW, clipH);
      ctx.clip();

      if (direction === 'forward') {
        // 페이지 면: clipX ~ foldX
        if (foldX > clipX) {
          const pg = ctx.createLinearGradient(clipX, 0, foldX, 0);
          pg.addColorStop(0,    'rgba(252, 248, 244, 0.60)');
          pg.addColorStop(0.80, 'rgba(252, 248, 244, 0.60)');
          pg.addColorStop(1,    'rgba(200, 190, 174, 0.75)');
          ctx.fillStyle = pg;
          ctx.fillRect(clipX, clipY, foldX - clipX, clipH);

          // fold 그림자
          const foldW = Math.min(70, foldX - clipX);
          const fs = ctx.createLinearGradient(foldX - foldW, 0, foldX, 0);
          fs.addColorStop(0,   'rgba(0,0,0,0)');
          fs.addColorStop(0.6, 'rgba(0,0,0,0.06)');
          fs.addColorStop(1,   'rgba(0,0,0,0.32)');
          ctx.fillStyle = fs;
          ctx.fillRect(Math.max(clipX, foldX - foldW), clipY, foldW, clipH);

          // cast shadow (fold 오른쪽)
          const castW = Math.min(40, clipX + clipW - foldX);
          if (castW > 0) {
            const cs = ctx.createLinearGradient(foldX, 0, foldX + castW, 0);
            cs.addColorStop(0, 'rgba(0,0,0,0.18)');
            cs.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = cs;
            ctx.fillRect(foldX, clipY, castW, clipH);
          }
        }
      } else {
        // backward: foldX ~ clipX+clipW 영역이 페이지 면
        if (foldX < clipX + clipW) {
          const pg = ctx.createLinearGradient(foldX, 0, clipX + clipW, 0);
          pg.addColorStop(0,    'rgba(200, 190, 174, 0.75)');
          pg.addColorStop(0.20, 'rgba(252, 248, 244, 0.60)');
          pg.addColorStop(1,    'rgba(252, 248, 244, 0.60)');
          ctx.fillStyle = pg;
          ctx.fillRect(foldX, clipY, clipX + clipW - foldX, clipH);

          // fold 그림자
          const foldW = Math.min(70, clipX + clipW - foldX);
          const fs = ctx.createLinearGradient(foldX, 0, foldX + foldW, 0);
          fs.addColorStop(0,   'rgba(0,0,0,0.32)');
          fs.addColorStop(0.4, 'rgba(0,0,0,0.06)');
          fs.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = fs;
          ctx.fillRect(foldX, clipY, foldW, clipH);

          // cast shadow (fold 왼쪽)
          const castW = Math.min(40, foldX - clipX);
          if (castW > 0) {
            const cs = ctx.createLinearGradient(foldX - castW, 0, foldX, 0);
            cs.addColorStop(0, 'rgba(0,0,0,0)');
            cs.addColorStop(1, 'rgba(0,0,0,0.18)');
            ctx.fillStyle = cs;
            ctx.fillRect(foldX - castW, clipY, castW, clipH);
          }
        }
      }

      ctx.restore(); // 클리핑 해제

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

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRestoredRef = useRef(false);
  const renditionRef = useRef<any>(null);
  const isFirstLocationRef = useRef(true);
  const currentLocationRef = useRef<string | number>(0);
  const prevPageNumRef = useRef<number>(-1);
  const isAnimatingRef = useRef(false);  // 애니메이션 중복 방지용
  const iframeBoundsRef = useRef<ClipBounds | null>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);

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
      if (doc.getElementById('cc-selection-style')) return; // 중복 방지
      const style = doc.createElement('style');
      style.id = 'cc-selection-style';
      style.innerHTML = SELECTION_CSS;
      // Append to body (after all epub stylesheets) so cascade order wins
      (doc.body ?? doc.head)?.appendChild(style);
    }

    // For future chapters
    rendition.hooks.content.register(injectStyle);

    // For already-rendered content
    rendition.getContents().forEach(injectStyle);

    // Generate locations for page counting
    rendition.book.ready.then(() => {
      rendition.book.locations.generate(1024).then(() => {
        setTotalPages(rendition.book.locations.length());
      });
    });

    // epub iframe 바운드 캐시 — 페이지 넘길 때마다 DOM 쿼리하지 않도록 미리 계산
    function cacheIframeBounds() {
      if (!readerContainerRef.current) return;
      const iframe = readerContainerRef.current.querySelector('iframe') as HTMLElement | null;
      if (!iframe) return;
      const iRect = iframe.getBoundingClientRect();
      const pRect = readerContainerRef.current.getBoundingClientRect();
      iframeBoundsRef.current = {
        clipX: iRect.left - pRect.left,
        clipY: iRect.top  - pRect.top,
        clipW: iRect.width,
        clipH: iRect.height,
      };
    }

    // rendered 이벤트 후 캐시 (iframe이 실제로 그려진 뒤)
    rendition.on('rendered', () => setTimeout(cacheIframeBounds, 0));
    // 창 리사이즈 시 재계산
    window.addEventListener('resize', cacheIframeBounds);
    return () => window.removeEventListener('resize', cacheIframeBounds);
  }, []);

  const handleLocationChanged = useCallback((loc: string | number) => {
    // CFI가 아닌 href 형태(TOC 클릭)이면 rendition.display()로 직접 이동
    if (typeof loc === 'string' && !loc.startsWith('epubcfi(')) {
      renditionRef.current?.display(loc);
      return;
    }

    currentLocationRef.current = loc;

    // locationFromCfi는 한 번만 호출 — 방향 감지 + 페이지 카운터 공유
    let newPageNum = -1;
    if (typeof loc === 'string' && renditionRef.current) {
      const locations = renditionRef.current.book?.locations;
      if (locations?.length() > 0) {
        newPageNum = locations.locationFromCfi(loc);
        if (newPageNum >= 0) setCurrentPage(newPageNum + 1);
      }
    }

    // Skip the very first event (initial render)
    if (isFirstLocationRef.current) {
      isFirstLocationRef.current = false;
    } else if (!isAnimatingRef.current) {
      // epub.js가 locationChanged를 한 페이지 넘김에 여러 번 발사하는 경우 방지
      // isAnimatingRef가 true인 동안은 추가 애니메이션 트리거 무시
      const dir: 'forward' | 'backward' =
        newPageNum >= 0 && prevPageNumRef.current >= 0 && newPageNum < prevPageNumRef.current
          ? 'backward'
          : 'forward';
      isAnimatingRef.current = true;
      setFlipDir(dir);
    }

    // 방향 감지 후 prevPageNum 업데이트 (비교 기준값이므로 비교 이후에 갱신)
    if (newPageNum >= 0) prevPageNumRef.current = newPageNum;

    setLocation(loc);

    if (!token || !id) return;

    if (!progressRestoredRef.current) {
      progressRestoredRef.current = true;
      return;
    }

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

      {/* Reader with page-flip overlay */}
      <div ref={readerContainerRef} className="flex-1 overflow-hidden relative">
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

        {/* Canvas page-turn animation — clipBounds는 렌더 시점에 이미 캐시된 값 */}
        {flipDir && (
          <PageTurnCanvas
            direction={flipDir}
            clipBounds={iframeBoundsRef.current}
            onDone={() => {
              isAnimatingRef.current = false;
              setFlipDir(null);
            }}
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
