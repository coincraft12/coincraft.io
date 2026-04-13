'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface CourseEditForm {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  price: number;
  isFree: boolean;
  isPublished: boolean;
  thumbnailUrl: string;
}

interface CourseResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    level: string;
    category: string | null;
    price: string;
    isFree: boolean;
    isPublished: boolean;
    thumbnailUrl: string | null;
  };
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CourseEditForm>({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    level: 'beginner',
    category: '',
    price: 0,
    isFree: false,
    isPublished: false,
    thumbnailUrl: '',
  });
  const [formError, setFormError] = useState('');

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['instructor-course-edit', id],
    queryFn: async () => {
      const res = await apiClient.get<CourseResponse>(`/api/v1/instructor/courses/${id}`, {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token && !!id,
  });

  useEffect(() => {
    if (courseData) {
      setForm({
        title: courseData.title,
        slug: courseData.slug,
        shortDescription: courseData.shortDescription ?? '',
        description: courseData.description ?? '',
        level: (courseData.level as CourseEditForm['level']) ?? 'beginner',
        category: courseData.category ?? '',
        price: Number(courseData.price),
        isFree: courseData.isFree,
        isPublished: courseData.isPublished,
        thumbnailUrl: courseData.thumbnailUrl ?? '',
      });
    }
  }, [courseData]);

  const mutation = useMutation({
    mutationFn: async (body: Partial<CourseEditForm>) => {
      await apiClient.put(`/api/v1/instructor/courses/${id}`, body, {
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-course', id] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      revalidateCourse(form.slug);
      router.push(`/instructor/courses/${id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('강좌 수정 중 오류가 발생했습니다.');
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('강좌 제목을 입력해 주세요.');
      return;
    }
    mutation.mutate({
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      shortDescription: form.shortDescription.trim() || undefined,
      description: form.description.trim() || undefined,
      level: form.level,
      category: form.category.trim() || undefined,
      price: form.isFree ? 0 : form.price,
      isFree: form.isFree,
      isPublished: form.isPublished,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
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
        <h1 className="text-3xl font-bold text-cc-text">강좌 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-cc-secondary border border-white/10 rounded-cc p-6">
        <Input
          label="강좌 제목 *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <Input
          label="슬러그"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />

        <Input
          label="썸네일 URL"
          placeholder="https://..."
          value={form.thumbnailUrl}
          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cc-text">간단 소개</label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm focus:outline-none focus:border-cc-accent transition-colors resize-none"
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cc-text">상세 설명</label>
          <textarea
            rows={6}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm focus:outline-none focus:border-cc-accent transition-colors resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-cc-text">난이도</label>
            <select
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value as CourseEditForm['level'] })}
            >
              <option value="beginner">입문</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>
          <Input
            label="카테고리"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="가격 (원)"
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            disabled={form.isFree}
          />
          <div className="flex flex-col gap-3 justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-cc-accent"
                checked={form.isFree}
                onChange={(e) => setForm({ ...form, isFree: e.target.checked, price: e.target.checked ? 0 : form.price })}
              />
              <span className="text-sm text-cc-text">무료 강좌</span>
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
