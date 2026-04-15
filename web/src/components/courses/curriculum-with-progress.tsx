'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import CurriculumAccordion from './curriculum-accordion';

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  isPreview: boolean;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Props {
  chapters: Chapter[];
  courseSlug: string;
  courseId: string;
  isEnrolled: boolean;
}

export default function CurriculumWithProgress({ chapters, courseSlug, courseId, isEnrolled }: Props) {
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isAuthLoading || !token) return;
    apiClient.get<{ success: boolean; data: { isEnrolled: boolean } }>(
      `/api/v1/courses/${courseSlug}`, { token }
    ).then((res) => {
      if (!res.data.isEnrolled) return;
      setEnrolled(true);
      return apiClient.get<{ success: boolean; data: Record<string, boolean> }>(
        `/api/v1/courses/${courseId}/progress`, { token }
      );
    }).then((res) => {
      if (res) setProgress(res.data);
    }).catch(() => {});
  }, [token, isAuthLoading, courseSlug, courseId]);

  return (
    <CurriculumAccordion
      chapters={chapters}
      courseSlug={courseSlug}
      isEnrolled={enrolled}
      progress={progress}
    />
  );
}
