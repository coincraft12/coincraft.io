'use client';

import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import { apiClient } from '@/lib/api-client';

// ─── localStorage helpers (동기 저장 - 어떤 이탈에서도 안전) ─────────────────

function localKey(lessonId: string) { return `vpos-${lessonId}`; }

function readLocal(lessonId: string): number {
  try { return parseInt(localStorage.getItem(localKey(lessonId)) ?? '0', 10) || 0; } catch { return 0; }
}

function writeLocal(lessonId: string, seconds: number) {
  try { if (seconds > 1) localStorage.setItem(localKey(lessonId), String(Math.floor(seconds))); } catch { /* ignore */ }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface VimeoPlayerInstance {
  setCurrentTime(s: number): Promise<void>;
  getCurrentTime(): Promise<number>;
  on(event: 'timeupdate', cb: (data: { seconds: number }) => void): void;
  on(event: string, cb: () => void): void;
  off(event: string, cb?: () => void): void;
}

interface YTPlayerInstance {
  seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number;
  destroy(): void;
}

declare global {
  interface Window {
    Vimeo?: { Player: new (el: HTMLIFrameElement) => VimeoPlayerInstance };
    YT?: { Player: new (el: HTMLElement, opts: object) => YTPlayerInstance };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  lessonId: string;
  embedUrl: string;
  videoProvider: string | null;
  initialSeconds: number; // from API (DB)
  token: string;
}

export default function VideoPlayer(props: Props) {
  if (props.videoProvider === 'vimeo') return <VimeoPlayer {...props} />;
  if (props.videoProvider === 'youtube') return <YouTubePlayer {...props} />;
  return (
    <iframe
      src={props.embedUrl}
      className="absolute inset-0 w-full h-full"
      allow="autoplay; fullscreen; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      allowFullScreen
      title="video"
    />
  );
}

// ─── Vimeo ────────────────────────────────────────────────────────────────────

function VimeoPlayer({ lessonId, embedUrl, initialSeconds, token }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayerInstance | null>(null);
  const currentTimeRef = useRef(0);   // 동기적으로 항상 최신 재생 위치 유지
  const apiIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // 효과적인 시작 위치: API 값과 localStorage 중 큰 값
  const effectiveStart = Math.max(initialSeconds, readLocal(lessonId));

  const saveAll = useCallback(() => {
    const s = currentTimeRef.current;
    writeLocal(lessonId, s);  // 동기 - 항상 성공
    if (s > 1) {
      apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
        { watchedSeconds: Math.floor(s) }, { token }).catch(() => {});
    }
  }, [lessonId, token]);

  const initPlayer = useCallback(() => {
    if (!iframeRef.current || !window.Vimeo) return;
    const player = new window.Vimeo.Player(iframeRef.current);
    playerRef.current = player;

    // timeupdate: 약 250ms마다 호출 → currentTimeRef 항상 최신
    player.on('timeupdate', ({ seconds }) => {
      currentTimeRef.current = seconds;
      writeLocal(lessonId, seconds);  // localStorage 매번 동기 저장
    });

    // 로드 완료 후 저장된 위치로 이동
    player.on('loaded', () => {
      if (effectiveStart > 5) player.setCurrentTime(effectiveStart);
    });

    // API는 10초마다 (DB 부하 감소)
    apiIntervalRef.current = setInterval(() => {
      const s = currentTimeRef.current;
      if (s > 1) {
        apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
          { watchedSeconds: Math.floor(s) }, { token }).catch(() => {});
      }
    }, 10000);
  }, [lessonId, effectiveStart, token]);

  useEffect(() => {
    // 탭 전환 / 브라우저 최소화 / 뒤로가기 직전에 저장
    const onHide = () => { if (document.visibilityState === 'hidden') saveAll(); };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      document.removeEventListener('visibilitychange', onHide);
      clearInterval(apiIntervalRef.current);
      saveAll();  // 언마운트 시: localStorage는 동기라 항상 저장됨
    };
  }, [saveAll]);

  return (
    <>
      <Script src="https://player.vimeo.com/api/player.js" onLoad={initPlayer} />
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="video"
      />
    </>
  );
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

function YouTubePlayer({ lessonId, embedUrl, initialSeconds, token }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const currentTimeRef = useRef(0);
  const apiIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const localIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const effectiveStart = Math.max(initialSeconds, readLocal(lessonId));

  const saveAll = useCallback(() => {
    const s = currentTimeRef.current;
    writeLocal(lessonId, s);
    if (s > 1) {
      apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
        { watchedSeconds: Math.floor(s) }, { token }).catch(() => {});
    }
  }, [lessonId, token]);

  useEffect(() => {
    const videoId = embedUrl.split('/embed/')[1]?.split('?')[0];
    if (!videoId || !containerRef.current) return;

    const init = () => {
      if (!containerRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0 },
        events: {
          onReady: () => {
            if (effectiveStart > 5) playerRef.current!.seekTo(effectiveStart, true);

            // YouTube는 timeupdate 이벤트 없음 → 1초 폴링
            localIntervalRef.current = setInterval(() => {
              if (!playerRef.current) return;
              const s = playerRef.current.getCurrentTime();
              currentTimeRef.current = s;
              writeLocal(lessonId, s);  // localStorage 1초마다 동기 저장
            }, 1000);

            // API는 10초마다
            apiIntervalRef.current = setInterval(() => {
              const s = currentTimeRef.current;
              if (s > 1) {
                apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
                  { watchedSeconds: Math.floor(s) }, { token }).catch(() => {});
              }
            }, 10000);
          },
        },
      });
    };

    if (window.YT?.Player) {
      init();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }

    const onHide = () => { if (document.visibilityState === 'hidden') saveAll(); };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      document.removeEventListener('visibilitychange', onHide);
      clearInterval(localIntervalRef.current);
      clearInterval(apiIntervalRef.current);
      saveAll();
      playerRef.current?.destroy();
    };
  }, [embedUrl, effectiveStart, lessonId, token, saveAll]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
