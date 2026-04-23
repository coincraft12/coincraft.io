'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import VimeoUploader from '@/components/ui/VimeoUploader';
import MarkdownEditor from '@/components/ui/MarkdownEditor';
import LessonMaterialsEditor from '@/components/ui/LessonMaterialsEditor';

interface LessonEditForm {
  title: string;
  type: 'video' | 'text' | 'quiz';
  videoProvider: 'youtube' | 'vimeo' | '';
  videoUrl: string;
  duration: number;
  isPreview: boolean;
  isPublished: boolean;
  textContent: string;
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

interface LessonDetailResponse {
  success: boolean;
  data: {
    id: string;
    courseId: string;
    chapterId: string;
    title: string;
    type: string;
    videoProvider: string | null;
    videoUrl: string | null;
    duration: number | null;
    isPreview: boolean;
    isPublished: boolean;
    textContent: string | null;
    order: number;
  };
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function EditLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<LessonEditForm>({
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
  const [courseId, setCourseId] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const { confirmLeave } = useUnsavedChanges(isDirty);

  function markDirty(updater: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...updater }));
    setIsDirty(true);
  }

  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['instructor-lesson-edit', lessonId],
    queryFn: async () => {
      const res = await apiClient.get<LessonDetailResponse>(
        `/api/v1/instructor/lessons/${lessonId}`,
        { token: token ?? undefined }
      );
      return res.data;
    },
    enabled: !!token && !!lessonId,
  });

  useEffect(() => {
    if (lessonData) {
      setCourseId(lessonData.courseId);
      setVideoDuration(lessonData.duration ?? 0);
      setForm({
        title: lessonData.title,
        type: (lessonData.type as LessonEditForm['type']) ?? 'video',
        videoProvider: (lessonData.videoProvider as LessonEditForm['videoProvider']) ?? '',
        videoUrl: lessonData.videoUrl ?? '',
        duration: lessonData.duration ?? 0,
        isPreview: lessonData.isPreview,
        isPublished: lessonData.isPublished,
        textContent: lessonData.textContent ?? '',
        order: lessonData.order,
      });
    }
  }, [lessonData]);

  const mutation = useMutation({
    mutationFn: async (body: Partial<LessonEditForm>) => {
      await apiClient.put(`/api/v1/instructor/lessons/${lessonId}`, body, {
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] });
      }
      revalidateCourse();
      if (courseId) {
        router.push(`/instructor/courses/${courseId}`);
      } else {
        router.back();
      }
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('레슨 수정 중 오류가 발생했습니다.');
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
    mutation.mutate({
      title: form.title.trim(),
      type: form.type,
      videoProvider: form.type === 'video' && form.videoProvider ? form.videoProvider : undefined,
      videoUrl: form.type === 'video' ? form.videoUrl.trim() || undefined : undefined,
      duration: videoDuration,
      isPreview: form.isPreview,
      isPublished: form.isPublished,
      textContent: form.textContent.trim() || undefined,
      order: form.order,
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="cc-label mb-1">INSTRUCTOR</p>
        <h1 className="text-3xl font-bold text-cc-text">레슨 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-cc-secondary border border-white/10 rounded-cc p-6">
        <Input
          label="레슨 제목 *"
          value={form.title}
          onChange={(e) => markDirty({ title: e.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cc-text">레슨 타입</label>
          <select
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
            value={form.type}
            onChange={(e) => markDirty({ type: e.target.value as LessonEditForm['type'] })}
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
                  markDirty({ videoProvider: e.target.value as LessonEditForm['videoProvider'] })
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
                  existingUrl={form.videoUrl || undefined}
                  onComplete={async (url) => {
                    markDirty({ videoUrl: url });
                    const duration = await fetchVimeoDuration(url);
                    if (duration > 0) setVideoDuration(duration);
                  }}
                />
              </div>
            ) : (
              <Input
                label="YouTube URL"
                placeholder="예: https://youtu.be/xxxxx"
                value={form.videoUrl}
                onChange={(e) => markDirty({ videoUrl: e.target.value })}
              />
            )}
          </>
        )}

        <MarkdownEditor
          label={form.type === 'text' ? '텍스트 내용' : '강의노트 (선택)'}
          value={form.textContent ?? ''}
          onChange={(v) => markDirty({ textContent: v })}
          height={form.type === 'text' ? 320 : 240}
        />

        <LessonMaterialsEditor lessonId={lessonId} token={token ?? ''} />

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
            <span className="text-sm text-cc-text">공개</span>
          </label>
        </div>

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>
            저장
          </Button>
          <Button type="button" variant="ghost" onClick={() => confirmLeave(() => router.back())}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
