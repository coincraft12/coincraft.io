'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

interface EnrollButtonProps {
  courseId: string;
  isFree: boolean;
  price: string;
  isEnrolled: boolean;
  firstLessonId?: string;
  courseSlug: string;
}

export default function EnrollButton({
  courseId,
  isFree,
  price,
  isEnrolled,
  firstLessonId,
  courseSlug,
}: EnrollButtonProps) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isEnrolled) {
    const href = firstLessonId
      ? `/courses/${courseSlug}/lessons/${firstLessonId}`
      : `/courses/${courseSlug}`;
    return (
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => router.push(href)}
      >
        이어서 학습
      </Button>
    );
  }

  if (isFree) {
    const handleEnroll = async () => {
      if (!token) {
        router.push('/login');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await apiClient.post(`/api/v1/courses/${courseId}/enroll`, undefined, { token });
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('수강 신청 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={handleEnroll}
        >
          무료 수강 신청
        </Button>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    );
  }

  // Paid course
  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={() => router.push(`/payment/checkout?courseId=${courseId}`)}
    >
      결제하기 — {price}원
    </Button>
  );
}
