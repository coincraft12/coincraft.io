import { create } from 'zustand';

interface VimeoUploadState {
  lessonId: string | null;
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  errorMsg: string;
  videoUri: string | null;
  uploadInstance: { abort: () => void } | null;
  resultUrl: string | null;
  uploadedFileName: string | null;

  setLessonId: (id: string) => void;
  setStatus: (s: VimeoUploadState['status']) => void;
  setProgress: (p: number) => void;
  setError: (msg: string) => void;
  setVideoUri: (uri: string) => void;
  setUploadInstance: (inst: { abort: () => void } | null) => void;
  setResultUrl: (url: string) => void;
  setUploadedFileName: (name: string) => void;
  reset: () => void;
}

export const useVimeoUploadStore = create<VimeoUploadState>((set, get) => ({
  lessonId: null,
  status: 'idle',
  progress: 0,
  errorMsg: '',
  videoUri: null,
  uploadInstance: null,
  resultUrl: null,
  uploadedFileName: null,

  setLessonId: (id) => {
    const current = get().lessonId;
    if (current !== id) {
      set({ lessonId: id, uploadedFileName: null, progress: 0, status: 'idle', resultUrl: null, errorMsg: '' });
    }
  },
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (errorMsg) => set({ errorMsg, status: 'error' }),
  setVideoUri: (videoUri) => set({ videoUri }),
  setUploadInstance: (uploadInstance) => set({ uploadInstance }),
  setResultUrl: (resultUrl) => set({ resultUrl, status: 'done' }),
  setUploadedFileName: (uploadedFileName) => set({ uploadedFileName }),
  reset: () => set({
    status: 'idle',
    progress: 0,
    errorMsg: '',
    videoUri: null,
    uploadInstance: null,
    resultUrl: null,
    uploadedFileName: null,
  }),
}));
