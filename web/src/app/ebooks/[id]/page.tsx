'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { useAuthStore } from '@/store/auth.store';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

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
        // Fetch metadata
        const metaRes = await fetch(`${API_BASE}/api/v1/ebooks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!metaRes.ok) {
          const body = await metaRes.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? '전자책 정보를 불러올 수 없습니다.');
        }
        const metaJson: EbookMetaResponse = await metaRes.json();
        setMeta(metaJson.data);

        // Fetch epub file as ArrayBuffer
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

  const handleLocationChanged = useCallback((loc: string | number) => {
    setLocation(loc);
  }, []);

  // While auth is loading
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
        <Button variant="outline" onClick={() => router.push('/ebooks')}>
          전자책 목록으로
        </Button>
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/ebooks')}
        >
          ← 목록
        </Button>

        <h1 className="text-cc-text text-sm font-semibold truncate max-w-[60%] text-center">
          {meta.title}
        </h1>

        <div className="w-16" />
      </header>

      {/* Reader */}
      <div className="flex-1 overflow-hidden">
        <ReactReader
          url={epubData}
          title={meta.title}
          location={location}
          locationChanged={handleLocationChanged}
          readerStyles={{
            ...ReactReaderStyle,
            container: {
              ...ReactReaderStyle.container,
              background: '#1a1a2e',
            },
            readerArea: {
              ...ReactReaderStyle.readerArea,
              background: '#1a1a2e',
            },
            arrow: {
              ...ReactReaderStyle.arrow,
              color: '#e2b84e',
            },
          }}
        />
      </div>
    </div>
  );
}
