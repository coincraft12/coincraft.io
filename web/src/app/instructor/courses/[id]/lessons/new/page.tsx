'use client';

import { useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import VimeoUploader from '@/components/ui/VimeoUploader';

interface CreateLessonBody {
  title: string;
  type: 'video' | 'text' | 'quiz';
  videoProvider?: 'youtube' | 'vimeo';
  videoUrl?: string;
  duration: number;
  isPreview: boolean;
  isPublished: boolean;
  textContent?: string;
  order: number;
}

async function fetchVimeoDuration(url: string): Promise<number> {
  try {
    if (url.includes('vimeo.com')) {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
      if (!res.ok) return 0;
      const data = await res.json();
      return typeof data.duration === 'number' ? data.duration : 0;
    }
  } catch {
    return 0;
  }
  return 0;
}

interface LessonResponse {
  success: boolean;
  data: { id: string; courseId: string };
}

export default function NewLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapterId = searchParams.get('chapterId') ?? '';
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateLessonBody>({
    title: '',
    type: 'video',
    videoProvider: 'vimeo',
    videoUrl: '',
    duration: 0,
    isPreview: false,
    isPublished: false,
    textContent: '',
    order: 0,
  });
  const [videoDuration, setVideoDuration] = useState(0);
  const [formError, setFormError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const { confirmLeave } = useUnsavedChanges(isDirty);

  function markDirty(updater: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...updater }));
    setIsDirty(true);
  }

  const mutation = useMutation({
    mutationFn: async (body: CreateLessonBody) => {
      const res = await apiClient.post<LessonResponse>(
        `/api/v1/instructor/chapters/${chapterId}/lessons`,
        body,
        { token: token ?? undefined }
      );
      return res.data;
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] });
      revalidateCourse();
      router.push(`/instructor/courses/${courseId}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('레슨 추가 중 오류가 발생했습니다.');
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('레슨 제목을 입력해 주세요.');
      return;
    }
    if (!chapterId) {
      setFormError('챕터 ID가 없습니다. URL을 확인해 주세요.');
      return;
    }
    const body: CreateLessonBody = {
      ...form,
      duration: videoDuration,
      videoProvider: form.type === 'video' ? form.videoProvider : undefined,
      videoUrl: form.type === 'video' ? form.videoUrl?.trim() || undefined : undefined,
      textContent: form.type === 'text' ? form.textContent?.trim() || undefined : undefined,
    };
    mutation.mutate(body);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="cc-label mb-1">INSTRUCTOR</p>
        <h1 className="text-3xl font-bold text-cc-text">레슨 추가</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-cc-secondary border border-white/10 rounded-cc p-6">
        <Input
          label="레슨 제목 *"
          placeholder="예: 스마트 컨트랙트 개요"
          value={form.title}
          onChange={(e) => markDirty({ title: e.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cc-text">레슨 타입</label>
          <select
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
            value={form.type}
            onChange={(e) => markDirty({ type: e.target.value as CreateLessonBody['type'] })}
          >
            <option value="video" className="text-black bg-white">영상</option>
            <option value="text" className="text-black bg-white">텍스트</option>
            <option value="quiz" className="text-black bg-white">퀴즈</option>
          </select>
        </div>

        {form.type === 'video' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-cc-text">영상 등록 방식</label>
              <select
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
                value={form.videoProvider}
                onChange={(e) =>
                  markDirty({ videoProvider: e.target.value as CreateLessonBody['videoProvider'] })
                }
              >
                <option value="vimeo" className="text-black bg-white">영상 업로드</option>
                <option value="youtube" className="text-black bg-white">YouTube URL</option>
              </select>
            </div>

            {form.videoProvider === 'vimeo' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-cc-text">영상 파일</label>
                <VimeoUploader
                  token={token ?? ''}
                  courseId={courseId}
                  onComplete={async (url) => {
                    markDirty({ videoUrl: url });
                    const duration = await fetchVimeoDuration(url);
                    if (duration > 0) setVideoDuration(duration);
                  }}
                />
                {form.videoUrl && (
                  <p className="text-xs text-cc-muted break-all">업로드 완료: {form.videoUrl}</p>
                )}
              </div>
            ) : (
              <Input
                label="YouTube URL"
                placeholder="예: https://youtu.be/xxxxx"
                value={form.videoUrl}
                onChange={(e) => markDirty({ videoUrl: e.target.value })}
                onBlur={async (e) => {
                  const duration = await fetchVimeoDuration(e.target.value);
                  setVideoDuration(duration);
                }}
              />
            )}
          </>
        )}

        {form.type === 'text' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-cc-text">텍스트 내용</label>
            <textarea
              rows={8}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm focus:outline-none focus:border-cc-accent transition-colors resize-none"
              placeholder="레슨 내용을 입력해 주세요."
              value={form.textContent}
              onChange={(e) => markDirty({ textContent: e.target.value })}
            />
          </div>
        )}

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-cc-accent"
              checked={form.isPreview}
              onChange={(e) => markDirty({ isPreview: e.target.checked })}
            />
            <span className="text-sm text-cc-text">미리보기 허용</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-cc-accent"
              checked={form.isPublished}
              onChange={(e) => markDirty({ isPublished: e.target.checked })}
            />
            <span className="text-sm text-cc-text">즉시 공개</span>
          </label>
        </div>

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>
            레슨 추가
          </Button>
          <Button type="button" variant="ghost" onClick={() => confirmLeave(() => router.back())}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
