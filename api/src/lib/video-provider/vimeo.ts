import type { VideoProvider, VideoMetadata } from './types';

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
