'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

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

export default function EditLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  const [form, setForm] = useState<LessonEditForm>({
    title: '',
    type: 'video',
    videoProvider: 'youtube',
    videoUrl: '',
    duration: 0,
    isPreview: false,
    isPublished: false,
    textContent: '',
    order: 0,
  });
  const [formError, setFormError] = useState('');
  const [courseId, setCourseId] = useState('');

  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['instructor-lesson-edit', lessonId],
    queryFn: async () => {
      // Use the LMS lesson detail endpoint (instructor access)
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
      duration: form.duration,
      isPreview: form.isPreview,
      isPublished: form.isPublished,
      textContent: form.type === 'text' ? form.textContent.trim() || undefined : undefined,
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
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-cc-text">레슨 타입</label>
            <select
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as LessonEditForm['type'] })}
            >
              <option value="video">영상</option>
              <option value="text">텍스트</option>
              <option value="quiz">퀴즈</option>
            </select>
          </div>
          <Input
            label="순서"
            type="number"
            min={0}
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
        </div>

        {form.type === 'video' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-cc-text">비디오 제공사</label>
              <select
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
                value={form.videoProvider}
                onChange={(e) =>
                  setForm({ ...form, videoProvider: e.target.value as LessonEditForm['videoProvider'] })
                }
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
              </select>
            </div>
            <Input
              label="비디오 URL"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            />
            <Input
              label="재생 시간 (초)"
              type="number"
              min={0}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            />
          </>
        )}

        {form.type === 'text' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-cc-text">텍스트 내용</label>
            <textarea
              rows={8}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm focus:outline-none focus:border-cc-accent transition-colors resize-none"
              value={form.textContent}
              onChange={(e) => setForm({ ...form, textContent: e.target.value })}
            />
          </div>
        )}

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-cc-accent"
              checked={form.isPreview}
              onChange={(e) => setForm({ ...form, isPreview: e.target.checked })}
            />
            <span className="text-sm text-cc-text">미리보기 허용</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-cc-accent"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            <span className="text-sm text-cc-text">공개</span>
          </label>
        </div>

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>
            저장
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
