'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { useAuthStore } from '@/store/auth.store';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

// ── Canvas-based page-turn animation ─────────────────────────────────────────
// clipBounds 없이 canvas 전체를 사용한다.
// 부모 div의 overflow:hidden + min-h-0 이 경계를 보장한다.
function PageTurnCanvas({ onDone, direction }: {
  onDone: () => void;
  direction: 'forward' | 'backward';
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
    const DURATION = 500;
    const start = performance.now();
    let rafId: number;

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function draw(now: number) {
      const raw = Math.min((now - start) / DURATION, 1);
      const t   = easeInOut(raw);

      // forward: 오른쪽→왼쪽 (foldX: W→0)
      // backward: 왼쪽→오른쪽 (foldX: 0→W)
      const foldX = direction === 'forward' ? W * (1 - t) : W * t;

      ctx.clearRect(0, 0, W, H);

      if (direction === 'forward') {
        if (foldX > 0) {
          // 페이지 면 (0 ~ foldX) — 불투명하게
          const pg = ctx.createLinearGradient(0, 0, foldX, 0);
          pg.addColorStop(0,    'rgba(245, 241, 232, 0.93)');
          pg.addColorStop(0.85, 'rgba(245, 241, 232, 0.93)');
          pg.addColorStop(1,    'rgba(195, 183, 160, 0.97)');
          ctx.fillStyle = pg;
          ctx.fillRect(0, 0, foldX, H);

          // fold 그림자
          const foldW = Math.min(80, foldX);
          const fs = ctx.createLinearGradient(foldX - foldW, 0, foldX, 0);
          fs.addColorStop(0,   'rgba(0,0,0,0)');
          fs.addColorStop(0.6, 'rgba(0,0,0,0.08)');
          fs.addColorStop(1,   'rgba(0,0,0,0.42)');
          ctx.fillStyle = fs;
          ctx.fillRect(Math.max(0, foldX - foldW), 0, foldW, H);

          // cast shadow (접힌 선 오른쪽)
          const castW = Math.min(40, W - foldX);
          if (castW > 0) {
            const cs = ctx.createLinearGradient(foldX, 0, foldX + castW, 0);
            cs.addColorStop(0, 'rgba(0,0,0,0.22)');
            cs.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = cs;
            ctx.fillRect(foldX, 0, castW, H);
          }
        }
      } else {
        // backward: foldX ~ W 영역이 페이지 면
        if (foldX < W) {
          const pg = ctx.createLinearGradient(foldX, 0, W, 0);
          pg.addColorStop(0,    'rgba(195, 183, 160, 0.97)');
          pg.addColorStop(0.15, 'rgba(245, 241, 232, 0.93)');
          pg.addColorStop(1,    'rgba(245, 241, 232, 0.93)');
          ctx.fillStyle = pg;
          ctx.fillRect(foldX, 0, W - foldX, H);

          // fold 그림자
          const foldW = Math.min(80, W - foldX);
          const fs = ctx.createLinearGradient(foldX, 0, foldX + foldW, 0);
          fs.addColorStop(0,   'rgba(0,0,0,0.42)');
          fs.addColorStop(0.4, 'rgba(0,0,0,0.08)');
          fs.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = fs;
          ctx.fillRect(foldX, 0, foldW, H);

          // cast shadow (접힌 선 왼쪽)
          const castW = Math.min(40, foldX);
          if (castW > 0) {
            const cs = ctx.createLinearGradient(foldX - castW, 0, foldX, 0);
            cs.addColorStop(0, 'rgba(0,0,0,0)');
            cs.addColorStop(1, 'rgba(0,0,0,0.22)');
            ctx.fillStyle = cs;
            ctx.fillRect(foldX - castW, 0, castW, H);
          }
        }
      }

      if (raw < 1) {
        rafId = requestAnimationFrame(draw);
      } else {
        onDone();
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [onDone, direction]);

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

  const saveDebounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTriggerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRestoredRef = useRef(false);
  const renditionRef       = useRef<any>(null);
  const isFirstLocationRef = useRef(true);
  const currentLocationRef = useRef<string | number>(0);
  // 방향 감지용: 이전 CFI 저장 (페이지 번호 대신 CFI 직접 비교)
  const prevPageNumRef     = useRef<number>(-1);

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

  const handleLocationChanged = useCallback((loc: string | number) => {
    // TOC href 형태 → rendition.display() 로 직접 이동
    if (typeof loc === 'string' && !loc.startsWith('epubcfi(')) {
      renditionRef.current?.display(loc);
      return;
    }

    currentLocationRef.current = loc;
    setLocation(loc);

    // 페이지 번호 업데이트 (locationFromCfi 단일 호출)
    let newPageNum = -1;
    if (typeof loc === 'string' && renditionRef.current) {
      const locs = renditionRef.current.book?.locations;
      if (locs?.length() > 0) {
        newPageNum = locs.locationFromCfi(loc);
        if (newPageNum >= 0) setCurrentPage(newPageNum + 1);
      }
    }

    // 최초 렌더 이벤트는 무시
    if (isFirstLocationRef.current) {
      isFirstLocationRef.current = false;
      if (newPageNum >= 0) prevPageNumRef.current = newPageNum;
      return;
    }

    // epub.js는 한 번 페이지 넘길 때 locationChanged를 여러 번 발사한다.
    // 50ms debounce로 마지막 이벤트만 사용 → 이중 애니메이션 방지
    if (animTriggerRef.current) clearTimeout(animTriggerRef.current);
    const capturedPageNum = newPageNum; // 클로저 캡처
    animTriggerRef.current = setTimeout(() => {
      // 방향 판별: 새 페이지 번호 < 이전 페이지 번호 → backward
      const dir: 'forward' | 'backward' =
        capturedPageNum >= 0 && prevPageNumRef.current >= 0 && capturedPageNum < prevPageNumRef.current
          ? 'backward'
          : 'forward';
      // 비교 완료 후 갱신
      if (capturedPageNum >= 0) prevPageNumRef.current = capturedPageNum;
      setFlipDir(dir);
    }, 50);

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
      <div className="flex-1 min-h-0 overflow-hidden relative">
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
            inset:0 + 부모 overflow:hidden 으로 경계 보장 */}
        {flipDir && (
          <PageTurnCanvas
            direction={flipDir}
            onDone={() => setFlipDir(null)}
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
