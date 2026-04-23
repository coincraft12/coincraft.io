'use client';

import { useRef, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useVimeoUploadStore } from '@/store/vimeo-upload.store';
import Spinner from './Spinner';

export default function VimeoUploader({
  token,
  courseId,
  existingUrl,
  onComplete,
}: {
  token: string;
  courseId: string;
  existingUrl?: string;   // 이미 저장된 영상 URL
  onComplete: (vimeoUrl: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [vimeoTitle, setVimeoTitle] = useState<string | null>(null);
  const {
    status, progress, errorMsg, videoUri, resultUrl, uploadedFileName,
    setStatus, setProgress, setError, setVideoUri, setUploadInstance, setResultUrl, setUploadedFileName, reset,
  } = useVimeoUploadStore();

  // 기존 Vimeo URL에서 영상 제목 가져오기
  useEffect(() => {
    if (!existingUrl || !existingUrl.includes('vimeo.com') || uploadedFileName) return;
    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(existingUrl)}`)
      .then((r) => r.json())
      .then((d) => { if (d.title) setVimeoTitle(d.title); })
      .catch(() => {});
  }, [existingUrl, uploadedFileName]);

  // 마운트 시: 스토어의 완료 URL이 현재 레슨과 다르면 초기화
  useEffect(() => {
    if (resultUrl && existingUrl && resultUrl !== existingUrl) {
      reset();
    }
    // 이미 완료된 업로드가 현재 레슨과 같은 URL이면 콜백 재호출
    if (status === 'done' && resultUrl && resultUrl === existingUrl) {
      onComplete(resultUrl);
    }
    // processing 중 페이지 복귀 시 폴링 재개
    if (status === 'processing' && videoUri) {
      pollStatus(videoUri);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pollStatus(uri: string) {
    setStatus('processing');
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await apiClient.get<{ success: boolean; data: { status: string; vimeoUrl: string | null } }>(
          `/api/v1/instructor/upload/vimeo-status?videoUri=${encodeURIComponent(uri)}`,
          { token }
        );
        if (res.data.status === 'available' && res.data.vimeoUrl) {
          setResultUrl(res.data.vimeoUrl);
          onComplete(res.data.vimeoUrl);
          return;
        }
      } catch {
        // 재시도
      }
    }
    // 타임아웃: status는 'processing' 유지해서 "재확인" 버튼 보이도록
    setVideoUri(uri);
    setStatus('processing');
  }

  async function handleFile(file: File) {
    reset();
    setUploadedFileName(file.name);
    setStatus('uploading');

    try {
      const init = await apiClient.post<{ success: boolean; data: { uploadLink: string; videoUri: string } }>(
        '/api/v1/instructor/upload/vimeo-init',
        { size: file.size, name: file.name, courseId },
        { token }
      );
      const { uploadLink, videoUri: uri } = init.data;
      setVideoUri(uri);

      const { Upload } = await import('tus-js-client');

      await new Promise<void>((resolve, reject) => {
        const upload = new Upload(file, {
          uploadUrl: uploadLink,
          chunkSize: 128 * 1024 * 1024,
          retryDelays: [0, 1000, 3000, 5000],
          metadata: { filename: file.name, filetype: file.type },
          onProgress(bytesUploaded, bytesTotal) {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onSuccess() { resolve(); },
          onError(err) { reject(err); },
        });
        setUploadInstance({ abort: () => upload.abort() });
        upload.start();
      });

      await pollStatus(uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    }
  }

  function handleAbort() {
    useVimeoUploadStore.getState().uploadInstance?.abort();
    reset();
  }

  // 업로드 중 / 처리 중이면 항상 진행 상태 표시 (교체 불가)
  if (status === 'uploading') {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-cc-muted">
          <span>업로드 중...</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-cc-accent rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button type="button" onClick={handleAbort} className="text-xs text-red-400 hover:underline">
          취소
        </button>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3 text-sm text-cc-muted">
          <Spinner size="sm" />
          <span>처리 중... (잠시 기다려 주세요)</span>
        </div>
        {videoUri && (
          <button
            type="button"
            onClick={() => pollStatus(videoUri)}
            className="text-xs text-cc-accent hover:underline whitespace-nowrap ml-2"
          >
            재확인
          </button>
        )}
      </div>
    );
  }

  // 이미 영상이 있으면 (기존 저장 URL 또는 방금 업로드 완료) → 교체 버튼만
  const currentUrl = (status === 'done' ? resultUrl : null) ?? existingUrl;
  if (currentUrl) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded text-sm">
        <span className="text-cc-muted text-xs truncate max-w-[70%]">{uploadedFileName ?? vimeoTitle ?? '영상 등록됨'}</span>
        <button
          type="button"
          onClick={() => { reset(); setTimeout(() => fileRef.current?.click(), 0); }}
          className="text-xs text-yellow-400 hover:text-yellow-300 ml-2 whitespace-nowrap"
        >
          영상 교체
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    );
  }

  // 영상 없음 → 업로드 영역
  if (status === 'error') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-400">{errorMsg}</p>
        <button type="button" onClick={reset} className="text-xs text-cc-accent hover:underline">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full border border-dashed border-white/30 rounded px-4 py-6 text-sm text-cc-muted hover:border-cc-accent/50 hover:text-cc-accent transition-colors text-center"
      >
        클릭하여 영상 파일 선택 (mp4, mov 등)
      </button>
    </div>
  );
}
