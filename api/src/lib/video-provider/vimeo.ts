import type { VideoProvider, VideoMetadata } from './types';

export async function getVimeoTranscript(videoUrl: string): Promise<string | null> {
  const match = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (!match) return null;
  const videoId = match[1];

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) return null;

  try {
    // 1. texttracks 목록 조회
    const res = await fetch(`https://api.vimeo.com/videos/${videoId}/texttracks`, {
      headers: { Authorization: `bearer ${token}` },
    });
    if (!res.ok) return null;

    const data = await res.json() as { data?: { link?: string; language?: string }[] };
    const track = data.data?.find(t => t.language?.startsWith('ko')) ?? data.data?.[0];
    if (!track?.link) return null;

    // 2. VTT 파일 다운로드
    const vttRes = await fetch(track.link);
    if (!vttRes.ok) return null;
    const vtt = await vttRes.text();

    // 3. VTT → 순수 텍스트 변환 (타임코드·태그 제거)
    const lines = vtt.split('\n');
    const textLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'WEBVTT' || trimmed.includes('-->') || /^\d+$/.test(trimmed)) continue;
      const clean = trimmed.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
      if (clean) textLines.push(clean);
    }

    // 중복 인접 라인 제거 후 합치기
    const deduped = textLines.filter((line, i) => line !== textLines[i - 1]);
    return deduped.join(' ').trim() || null;
  } catch {
    return null;
  }
}

export class VimeoProvider implements VideoProvider {
  extractId(url: string): string | null {
    const match = url.match(/(?:vimeo\.com\/)(\d+)/);
    return match ? match[1] : null;
  }

  getEmbedUrl(idOrUrl: string): string {
    // unlisted 영상: https://vimeo.com/123456/abcdef → ?h=abcdef 포함 필요
    const match = idOrUrl.match(/vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/);
    const id = match?.[1] ?? idOrUrl;
    const hash = match?.[2];
    const base = `https://player.vimeo.com/video/${id}?badge=0&autopause=0&player_id=0&app_id=58479`;
    return hash ? `${base}&h=${hash}` : base;
  }

  async getMetadata(id: string): Promise<VideoMetadata> {
    const headers: Record<string, string> = {};
    if (process.env.VIMEO_ACCESS_TOKEN) {
      headers['Authorization'] = `bearer ${process.env.VIMEO_ACCESS_TOKEN}`;
    }

    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`,
      { headers }
    );

    if (!res.ok) {
      return { id };
    }

    const data = await res.json() as {
      title?: string;
      duration?: number;
      thumbnail_url?: string;
    };

    return {
      id,
      title: data.title,
      duration: data.duration,
      thumbnailUrl: data.thumbnail_url,
    };
  }
}
