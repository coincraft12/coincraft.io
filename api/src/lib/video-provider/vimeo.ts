import type { VideoProvider, VideoMetadata } from './types';

export class VimeoProvider implements VideoProvider {
  extractId(url: string): string | null {
    const match = url.match(/(?:vimeo\.com\/)(\d+)/);
    return match ? match[1] : null;
  }

  getEmbedUrl(idOrUrl: string): string {
    const id = this.extractId(idOrUrl) ?? idOrUrl;
    return `https://player.vimeo.com/video/${id}?badge=0&autopause=0&player_id=0&app_id=58479`;
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
