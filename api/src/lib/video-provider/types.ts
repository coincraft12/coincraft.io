export interface VideoMetadata {
  id: string;
  title?: string;
  duration?: number;
  thumbnailUrl?: string;
}

export interface VideoProvider {
  extractId(url: string): string | null;
  getEmbedUrl(idOrUrl: string): string;
  getMetadata?(id: string): Promise<VideoMetadata>;
}
