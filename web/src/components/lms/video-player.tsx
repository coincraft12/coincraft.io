'use client';

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// ─── localStorage (동기 저장) ─────────────────────────────────────────────────

function localKey(id: string) { return `vpos-${id}`; }
function readLocal(id: string): number {
  try { return parseInt(localStorage.getItem(localKey(id)) ?? '0', 10) || 0; } catch { return 0; }
}
function writeLocal(id: string, s: number) {
  try { if (s > 1) localStorage.setItem(localKey(id), String(Math.floor(s))); } catch { /* */ }
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

interface Props {
  lessonId: string;
  embedUrl: string;
  videoProvider: string | null;
  initialSeconds: number;
  token: string;
}

// ─── Entry ────────────────────────────────────────────────────────────────────

export default function VideoPlayer(props: Props) {
  if (props.videoProvider === 'vimeo') return <VimeoPlayer {...props} />;
  if (props.videoProvider === 'youtube') return <YouTubePlayer {...props} />;
  return (
    <iframe src={props.embedUrl} className="absolute inset-0 w-full h-full"
      allow="autoplay; fullscreen; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      allowFullScreen title="video" />
  );
}

// ─── Vimeo ────────────────────────────────────────────────────────────────────

function VimeoPlayer({ lessonId, embedUrl, initialSeconds, token }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayerInstance | null>(null);
  const currentTimeRef = useRef(0);
  const apiTimerRef = useRef<ReturnType<typeof setInterval>>();

  // 마운트 시점에 계산 — localStorage 값 우선
  const startRef = useRef(Math.max(initialSeconds, readLocal(lessonId)));

  const saveAll = useCallback(() => {
    const s = currentTimeRef.current;
    writeLocal(lessonId, s);
    if (s > 1) apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
      { watchedSeconds: Math.floor(s) }, { token }).catch(() => {});
  }, [lessonId, token]);

  // 핵심: SDK가 이미 로드된 경우(뒤로가기 등)에도 즉시 초기화
  const initPlayer = useCallback(() => {
    if (!iframeRef.current || !window.Vimeo || playerRef.current) return;

    const player = new window.Vimeo.Player(iframeRef.current);
    playerRef.current = player;

    // timeupdate(~250ms) → localStorage 동기 저장
    player.on('timeupdate', ({ seconds }) => {
      currentTimeRef.current = seconds;
      writeLocal(lessonId, seconds);
    });

    // seek: 즉시 시도 + loaded 이벤트에서도 시도 (둘 중 하나는 반드시 성공)
    const seek = () => {
      if (startRef.current > 5) player.setCurrentTime(startRef.current).catch(() => {});
    };
    seek();
    player.on('loaded', seek);

    // API는 10초마다
    apiTimerRef.current = setInterval(() => {
      const s = currentTimeRef.current;
      if (s > 1) apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
        { watchedSeconds: Math.floor(s) }, { token }).catch(() => {});
    }, 10000);
  }, [lessonId, token]);

  useEffect(() => {
    // ① Vimeo SDK 이미 로드됨 (뒤로가기, 재방문) → 즉시 초기화
    if (window.Vimeo) {
      initPlayer();
    } else {
      // ② SDK 미로드 → script 동적 삽입
      if (!document.querySelector('script[src*="player.vimeo.com/api/player.js"]')) {
        const s = document.createElement('script');
        s.src = 'https://player.vimeo.com/api/player.js';
        s.onload = initPlayer;
        document.head.appendChild(s);
      } else {
        // 스크립트 태그는 있지만 아직 실행 안 됨 → 로드 대기
        const existing = document.querySelector('script[src*="player.vimeo.com/api/player.js"]')!;
        existing.addEventListener('load', initPlayer, { once: true });
      }
    }

    // visibilitychange: 탭 전환 / 뒤로가기 직전 저장
    const onHide = () => { if (document.visibilityState === 'hidden') saveAll(); };
    document.addEventListener('visibilitychange', onHide);
    // pagehide: bfcache 진입 직전에도 저장
    window.addEventListener('pagehide', saveAll);

    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', saveAll);
      clearInterval(apiTimerRef.current);
      saveAll();
    };
  }, [initPlayer, saveAll]);

  return (
    <iframe ref={iframeRef} src={embedUrl} className="absolute inset-0 w-full h-full"
      allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="video" />
  );
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

function YouTubePlayer({ lessonId, embedUrl, initialSeconds, token }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const currentTimeRef = useRef(0);
  const localTimerRef = useRef<ReturnType<typeof setInterval>>();
  const apiTimerRef = useRef<ReturnType<typeof setInterval>>();

  const startRef = useRef(Math.max(initialSeconds, readLocal(lessonId)));

  const saveAll = useCallback(() => {
    const s = currentTimeRef.current;
    writeLocal(lessonId, s);
    if (s > 1) apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
      { watchedSeconds: Math.floor(s) }, { token }).catch(() => {});
  }, [lessonId, token]);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !window.YT?.Player || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: embedUrl.split('/embed/')[1]?.split('?')[0] ?? '',
      playerVars: { rel: 0 },
      events: {
        onReady: () => {
          if (startRef.current > 5) playerRef.current!.seekTo(startRef.current, true);

          // 1초마다 localStorage 동기 저장
          localTimerRef.current = setInterval(() => {
            const s = playerRef.current?.getCurrentTime() ?? 0;
            currentTimeRef.current = s;
            writeLocal(lessonId, s);
          }, 1000);

          // API 10초마다
          apiTimerRef.current = setInterval(() => {
            const s = currentTimeRef.current;
            if (s > 1) apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
              { watchedSeconds: Math.floor(s) }, { token }).catch(() => {});
          }, 10000);
        },
      },
    });
  }, [lessonId, embedUrl, token]);

  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }

    const onHide = () => { if (document.visibilityState === 'hidden') saveAll(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', saveAll);

    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', saveAll);
      clearInterval(localTimerRef.current);
      clearInterval(apiTimerRef.current);
      saveAll();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [initPlayer, saveAll]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
