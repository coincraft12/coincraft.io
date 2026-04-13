import type { VideoProvider, VideoMetadata } from './types';

export class YouTubeProvider implements VideoProvider {
  extractId(url: string): string | null {
    // watch?v= pattern
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];

    // youtu.be/ pattern
    match = url.match(/youtu\.be\/([^?&]+)/);
    if (match) return match[1];

    // embed/ pattern
    match = url.match(/embed\/([^?&]+)/);
    if (match) return match[1];

    return null;
  }

  getEmbedUrl(idOrUrl: string): string {
    const id = this.extractId(idOrUrl) ?? idOrUrl;
    return `https://www.youtube.com/embed/${id}?rel=0`;
  }

  async getMetadata(id: string): Promise<VideoMetadata> {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${id}&format=json`
    );

    if (!res.ok) {
      return { id };
    }

    const data = await res.json() as {
      title?: string;
      thumbnail_url?: string;
    };

    return {
      id,
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
    };
  }
}
