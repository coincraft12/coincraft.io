'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface CreateChapterBody {
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
}

export default function NewChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateChapterBody>({
    title: '',
    description: '',
    order: 0,
    isPublished: false,
  });
  const [formError, setFormError] = useState('');

  const mutation = useMutation({
    mutationFn: async (body: CreateChapterBody) => {
      await apiClient.post(
        `/api/v1/instructor/courses/${courseId}/chapters`,
        body,
        { token: token ?? undefined }
      );
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
        setFormError('챕터 추가 중 오류가 발생했습니다.');
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('챕터 제목을 입력해 주세요.');
      return;
    }
    mutation.mutate({
      ...form,
      description: form.description?.trim() || undefined,
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="cc-label mb-1">INSTRUCTOR</p>
        <h1 className="text-3xl font-bold text-cc-text">챕터 추가</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-cc-secondary border border-white/10 rounded-cc p-6">
        <Input
          label="챕터 제목 *"
          placeholder="예: 1장. 블록체인 기초"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cc-text">설명 (선택)</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm focus:outline-none focus:border-cc-accent transition-colors resize-none"
            placeholder="챕터에 대한 간단한 설명"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-cc-accent"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          <span className="text-sm text-cc-text">즉시 공개</span>
        </label>

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>
            챕터 추가
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
