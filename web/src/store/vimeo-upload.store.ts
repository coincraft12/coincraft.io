import { create } from 'zustand';

interface VimeoUploadState {
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  errorMsg: string;
  videoUri: string | null;        // /videos/12345 — polling 에 필요
  uploadInstance: { abort: () => void } | null;  // TUS 인스턴스
  resultUrl: string | null;       // 완료 후 Vimeo URL

  setStatus: (s: VimeoUploadState['status']) => void;
  setProgress: (p: number) => void;
  setError: (msg: string) => void;
  setVideoUri: (uri: string) => void;
  setUploadInstance: (inst: { abort: () => void } | null) => void;
  setResultUrl: (url: string) => void;
  reset: () => void;
}

export const useVimeoUploadStore = create<VimeoUploadState>((set) => ({
  status: 'idle',
  progress: 0,
  errorMsg: '',
  videoUri: null,
  uploadInstance: null,
  resultUrl: null,

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (errorMsg) => set({ errorMsg, status: 'error' }),
  setVideoUri: (videoUri) => set({ videoUri }),
  setUploadInstance: (uploadInstance) => set({ uploadInstance }),
  setResultUrl: (resultUrl) => set({ resultUrl, status: 'done' }),
  reset: () => set({
    status: 'idle',
    progress: 0,
    errorMsg: '',
    videoUri: null,
    uploadInstance: null,
    resultUrl: null,
  }),
}));
