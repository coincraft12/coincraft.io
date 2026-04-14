'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { useAuthStore } from '@/store/auth.store';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

// ── Canvas-based page-turn animation ─────────────────────────────────────────
function PageTurnCanvas({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement!;
    canvas.width  = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    const W = canvas.width;
    const H = canvas.height;
    const DURATION = 650;
    const start = performance.now();
    let rafId: number;

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function draw(now: number) {
      const raw = Math.min((now - start) / DURATION, 1);
      const t   = easeInOut(raw);
      const foldX = W * (1 - t);

      ctx.clearRect(0, 0, W, H);

      if (foldX > 0) {
        // ── Page face (cream/white) sweeping right→left ──────────────────
        const pg = ctx.createLinearGradient(0, 0, foldX, 0);
        pg.addColorStop(0,    'rgba(252, 248, 244, 0.98)');
        pg.addColorStop(0.80, 'rgba(252, 248, 244, 0.98)');
        pg.addColorStop(1,    'rgba(205, 195, 180, 0.96)');
        ctx.fillStyle = pg;
        ctx.fillRect(0, 0, foldX, H);

        // ── Fold shadow on the page face (near the fold line) ────────────
        const foldW = Math.min(70, foldX);
        const fs = ctx.createLinearGradient(foldX - foldW, 0, foldX, 0);
        fs.addColorStop(0, 'rgba(0,0,0,0)');
        fs.addColorStop(0.6, 'rgba(0,0,0,0.07)');
        fs.addColorStop(1, 'rgba(0,0,0,0.38)');
        ctx.fillStyle = fs;
        ctx.fillRect(Math.max(0, foldX - foldW), 0, foldW, H);

        // ── Cast shadow on the content to the right of the fold ──────────
        const castW = Math.min(45, W - foldX);
        if (castW > 0) {
          const cs = ctx.createLinearGradient(foldX, 0, foldX + castW, 0);
          cs.addColorStop(0, 'rgba(0,0,0,0.22)');
          cs.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = cs;
          ctx.fillRect(foldX, 0, castW, H);
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
  }, [onDone]);

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
  const [showFlip, setShowFlip] = useState(false);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRestoredRef = useRef(false);
  const renditionRef = useRef<any>(null);
  const isFirstLocationRef = useRef(true);
  const currentLocationRef = useRef<string | number>(0);

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
  }, []);

  const handleLocationChanged = useCallback((loc: string | number) => {
    // CFI가 아닌 href 형태(TOC 클릭)이면 rendition.display()로 직접 이동
    if (typeof loc === 'string' && !loc.startsWith('epubcfi(')) {
      renditionRef.current?.display(loc);
      return;
    }

    currentLocationRef.current = loc;

    // Skip the very first event (initial render)
    if (isFirstLocationRef.current) {
      isFirstLocationRef.current = false;
    } else {
      // Trigger page-turn animation
      setShowFlip(true);
    }

    setLocation(loc);

    // Update current page number
    if (renditionRef.current && typeof loc === 'string') {
      const locations = renditionRef.current.book?.locations;
      if (locations?.length() > 0) {
        const pageNum = locations.locationFromCfi(loc);
        if (pageNum >= 0) setCurrentPage(pageNum + 1);
      }
    }

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
      <div className="flex-1 overflow-hidden relative">
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

        {/* Canvas page-turn animation */}
        {showFlip && (
          <PageTurnCanvas onDone={() => setShowFlip(false)} />
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
