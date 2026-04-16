'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import MarkdownEditor from '@/components/ui/MarkdownEditor';
import ThumbnailUploader from '@/components/ui/ThumbnailUploader';

interface CreateCourseBody {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  originalPrice?: number;
  price: number;
  isFree: boolean;
}

interface CourseResponse {
  success: boolean;
  data: { id: string; slug: string };
}

export default function NewCoursePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  const [form, setForm] = useState<CreateCourseBody>({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    thumbnailUrl: '',
    level: 'beginner',
    category: '',
    originalPrice: 0,
    price: 0,
    isFree: false,
  });
  const [formError, setFormError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const { confirmLeave } = useUnsavedChanges(isDirty);

  function markDirty(updater: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...updater }));
    setIsDirty(true);
  }

  const mutation = useMutation({
    mutationFn: async (body: CreateCourseBody) => {
      const res = await apiClient.post<CourseResponse>('/api/v1/instructor/courses', body, {
        token: token ?? undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setIsDirty(false);
      revalidateCourse(data.slug);
      router.push(`/instructor/courses/${data.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('강좌 생성 중 오류가 발생했습니다.');
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
    if (!form.isFree && form.originalPrice && form.originalPrice > 0 && form.price > form.originalPrice) {
      setFormError('판매가는 정가보다 클 수 없습니다.');
      return;
    }
    const body: CreateCourseBody = {
      ...form,
      slug: form.slug?.trim() || undefined,
      shortDescription: form.shortDescription?.trim() || undefined,
      description: form.description?.trim() || undefined,
      thumbnailUrl: form.thumbnailUrl?.trim() || undefined,
      category: form.category?.trim() || undefined,
    };
    mutation.mutate(body);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="cc-label mb-1">INSTRUCTOR</p>
        <h1 className="text-3xl font-bold text-cc-text">새 강좌 만들기</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-cc-secondary border border-white/10 rounded-cc p-6">
        <Input
          label="강좌 제목 *"
          placeholder="예: Web3 스마트 컨트랙트 입문"
          value={form.title}
          onChange={(e) => markDirty({ title: e.target.value })}
        />

        <Input
          label="슬러그 (비워두면 자동 생성)"
          placeholder="예: web3-smart-contract-intro"
          value={form.slug}
          onChange={(e) => markDirty({ slug: e.target.value })}
        />

        <ThumbnailUploader
          value={form.thumbnailUrl ?? ''}
          onChange={(url) => markDirty({ thumbnailUrl: url })}
          token={token ?? ''}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cc-text">간단 소개</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text placeholder-cc-muted text-sm focus:outline-none focus:border-cc-accent transition-colors resize-none"
            placeholder="강좌를 한 두 문장으로 소개해 주세요."
            value={form.shortDescription}
            onChange={(e) => markDirty({ shortDescription: e.target.value })}
          />
        </div>

        <MarkdownEditor
          label="상세 설명"
          value={form.description ?? ''}
          onChange={(v) => markDirty({ description: v })}
          height={360}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-cc-text">난이도</label>
            <select
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-cc-text text-sm focus:outline-none focus:border-cc-accent transition-colors"
              value={form.level}
              onChange={(e) => markDirty({ level: e.target.value as CreateCourseBody['level'] })}
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
            onChange={(e) => markDirty({ originalPrice: Number(e.target.value) })}
            onFocus={(e) => e.target.select()}
            disabled={form.isFree}
          />
          <Input
            label="판매가 (원)"
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => markDirty({ price: Number(e.target.value) })}
            onFocus={(e) => e.target.select()}
            disabled={form.isFree}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4 accent-cc-accent"
            checked={form.isFree}
            onChange={(e) => markDirty({ isFree: e.target.checked, price: e.target.checked ? 0 : form.price, originalPrice: e.target.checked ? 0 : form.originalPrice })}
          />
          <span className="text-sm text-cc-text">무료 강좌</span>
        </div>

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>
            강좌 생성
          </Button>
          <Button type="button" variant="ghost" onClick={() => confirmLeave(() => router.back())}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
