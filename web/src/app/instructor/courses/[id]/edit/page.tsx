'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import MarkdownEditor from '@/components/ui/MarkdownEditor';
import ThumbnailUploader from '@/components/ui/ThumbnailUploader';

interface CourseEditForm {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  originalPrice: number;
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
    originalPrice: string | null;
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
    originalPrice: 0,
    price: 0,
    isFree: false,
    isPublished: false,
    thumbnailUrl: '',
  });
  const [formError, setFormError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const { confirmLeave } = useUnsavedChanges(isDirty);

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

  // courseData 로드 후 form 초기화 — 이 시점엔 dirty가 아님
  // 이후 사용자가 수정하면 dirty로 변경 (아래 별도 effect)
  const [initialForm, setInitialForm] = useState<CourseEditForm | null>(null);

  useEffect(() => {
    if (courseData) {
      const loaded: CourseEditForm = {
        title: courseData.title,
        slug: courseData.slug,
        shortDescription: courseData.shortDescription ?? '',
        description: courseData.description ?? '',
        level: (courseData.level as CourseEditForm['level']) ?? 'beginner',
        category: courseData.category ?? '',
        originalPrice: Number(courseData.originalPrice ?? 0),
        price: Number(courseData.price),
        isFree: courseData.isFree,
        isPublished: courseData.isPublished,
        thumbnailUrl: courseData.thumbnailUrl ?? '',
      };
      setForm(loaded);
      setInitialForm(loaded);
      setIsDirty(false);
    }
  }, [courseData]);

  useEffect(() => {
    if (initialForm) {
      setIsDirty(JSON.stringify(form) !== JSON.stringify(initialForm));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const mutation = useMutation({
    mutationFn: async (body: Partial<CourseEditForm>) => {
      await apiClient.put(`/api/v1/instructor/courses/${id}`, body, {
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      setIsDirty(false);
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
    if (!form.isFree && form.originalPrice > 0 && form.price > form.originalPrice) {
      setFormError('판매가는 정가보다 클 수 없습니다.');
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
      originalPrice: form.isFree ? 0 : form.originalPrice,
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

      <div className="bg-cc-accent/10 border border-cc-accent/30 rounded-cc px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-cc-muted">챕터·레슨 편집은 커리큘럼 관리 페이지에서 할 수 있습니다.</p>
        <button
          type="button"
          onClick={() => router.push(`/instructor/courses/${id}`)}
          className="text-sm text-cc-accent hover:underline ml-4 whitespace-nowrap"
        >
          커리큘럼 관리 →
        </button>
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

        <ThumbnailUploader
          value={form.thumbnailUrl}
          onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
          token={token ?? ''}
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

        <MarkdownEditor
          label="상세 설명"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          height={360}
        />

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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="정가 (원)"
            type="number"
            min={0}
            value={form.originalPrice}
            onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
            onFocus={(e) => e.target.select()}
            disabled={form.isFree}
          />
          <Input
            label="판매가 (원)"
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            onFocus={(e) => e.target.select()}
            disabled={form.isFree}
          />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-cc-accent"
              checked={form.isFree}
              onChange={(e) => setForm({ ...form, isFree: e.target.checked, price: e.target.checked ? 0 : form.price, originalPrice: e.target.checked ? 0 : form.originalPrice })}
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
