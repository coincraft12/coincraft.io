'use client';

import { useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
    videoProvider: 'youtube',
    videoUrl: '',
    duration: 0,
    isPreview: false,
    isPublished: false,
    textContent: '',
    order: 0,
  });
  const [videoDuration, setVideoDuration] = useState(0);
  const [formError, setFormError] = useState('');

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
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-cc-text">레슨 타입</label>
            <select
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as CreateLessonBody['type'] })}
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
                  setForm({ ...form, videoProvider: e.target.value as CreateLessonBody['videoProvider'] })
                }
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
              </select>
            </div>

            <Input
              label="비디오 URL"
              placeholder="예: https://youtu.be/xxxxx"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              onBlur={async (e) => {
                const duration = await fetchVimeoDuration(e.target.value);
                setVideoDuration(duration);
              }}
            />
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
            <span className="text-sm text-cc-text">즉시 공개</span>
          </label>
        </div>

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>
            레슨 추가
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
