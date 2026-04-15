'use client';

import { useState, useEffect } from 'react';
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
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [continueLessonId, setContinueLessonId] = useState<string | undefined>(firstLessonId);
  const [checking, setChecking] = useState(true); // 토큰 있을 때 API 확인 전까지 숨김
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 서버 컴포넌트는 토큰 없이 fetch하므로 클라이언트에서 수강 여부 + 진도 재확인
  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) { setChecking(false); return; }

    Promise.all([
      apiClient.get<{ success: boolean; data: { isEnrolled: boolean; chapters: { lessons: { id: string }[] }[] } }>(
        `/api/v1/courses/${courseSlug}`,
        { token }
      ),
      apiClient.get<{ success: boolean; data: Record<string, boolean> }>(
        `/api/v1/courses/${courseId}/progress`,
        { token }
      ).catch(() => ({ data: {} as Record<string, boolean> })),
    ]).then(([courseRes, progressRes]) => {
      if (courseRes.data.isEnrolled) {
        setEnrolled(true);
        const progress = (progressRes as { data: Record<string, boolean> }).data;
        const allLessons = courseRes.data.chapters.flatMap((ch) => ch.lessons);
        const nextLesson = allLessons.find((l) => !progress[l.id]);
        setContinueLessonId(nextLesson?.id ?? firstLessonId);
      }
    }).catch(() => {}).finally(() => setChecking(false));
  }, [token, isAuthLoading, courseSlug, courseId, firstLessonId]);

  if (checking) {
    return <div className="w-full h-11 rounded-cc bg-white/10 animate-pulse" />;
  }

  if (enrolled) {
    const href = continueLessonId
      ? `/courses/${courseSlug}/lessons/${continueLessonId}`
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
        router.push(`/login?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`);
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
      onClick={() => router.push(`/checkout/${courseId}`)}
    >
      결제하기 — {price}원
    </Button>
  );
}
