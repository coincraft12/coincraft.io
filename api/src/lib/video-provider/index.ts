import { VideoProvider } from './types';
import { VimeoProvider } from './vimeo';
import { YouTubeProvider } from './youtube';

export function createVideoProvider(type: string): VideoProvider {
  switch (type) {
    case 'vimeo': return new VimeoProvider();
    case 'youtube': return new YouTubeProvider();
    default: throw new Error(`Unknown video provider: ${type}`);
  }
}

export * from './types';
