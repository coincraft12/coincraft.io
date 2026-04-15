'use client';

import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import { apiClient } from '@/lib/api-client';

declare global {
  interface Window {
    Vimeo?: {
      Player: new (el: HTMLIFrameElement) => {
        setCurrentTime(s: number): Promise<void>;
        getCurrentTime(): Promise<number>;
        on(event: string, cb: () => void): void;
      };
    };
    YT?: {
      Player: new (el: HTMLElement, opts: object) => {
        seekTo(s: number, allow: boolean): void;
        getCurrentTime(): number;
        destroy(): void;
      };
    };
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

export default function VideoPlayer(props: Props) {
  const { videoProvider, embedUrl } = props;

  if (videoProvider === 'vimeo') return <VimeoPlayer {...props} />;
  if (videoProvider === 'youtube') return <YouTubePlayer {...props} />;

  return (
    <iframe
      src={embedUrl}
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
  const playerRef = useRef<ReturnType<NonNullable<Window['Vimeo']>['Player']> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const saveProgress = useCallback(async () => {
    if (!playerRef.current) return;
    try {
      const seconds = await playerRef.current.getCurrentTime();
      if (seconds > 1) {
        apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
          { watchedSeconds: Math.floor(seconds) }, { token }).catch(() => {});
      }
    } catch { /* ignore */ }
  }, [lessonId, token]);

  const initPlayer = useCallback(() => {
    if (!iframeRef.current || !window.Vimeo) return;
    const player = new window.Vimeo.Player(iframeRef.current);
    playerRef.current = player;

    player.on('loaded', () => {
      if (initialSeconds > 5) player.setCurrentTime(initialSeconds);
      intervalRef.current = setInterval(saveProgress, 5000);
    });
  }, [initialSeconds, saveProgress]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      saveProgress();
    };
  }, [saveProgress]);

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
  const playerRef = useRef<ReturnType<NonNullable<Window['YT']>['Player']> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const saveProgress = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const seconds = playerRef.current.getCurrentTime();
      if (seconds > 1) {
        apiClient.post(`/api/v1/lessons/${lessonId}/progress`,
          { watchedSeconds: Math.floor(seconds) }, { token }).catch(() => {});
      }
    } catch { /* ignore */ }
  }, [lessonId, token]);

  useEffect(() => {
    const videoId = embedUrl.split('/embed/')[1]?.split('?')[0];
    if (!videoId || !containerRef.current) return;

    const init = () => {
      if (!containerRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { start: Math.floor(initialSeconds), rel: 0 },
        events: {
          onReady: () => {
            if (initialSeconds > 5) playerRef.current!.seekTo(initialSeconds, true);
            intervalRef.current = setInterval(saveProgress, 5000);
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

    return () => {
      clearInterval(intervalRef.current);
      saveProgress();
      playerRef.current?.destroy();
    };
  }, [embedUrl, initialSeconds, saveProgress]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
