'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';

interface ProgressResponse {
  success: boolean;
  data: Record<string, boolean>;
}

export function useLessonProgress(courseId: string) {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Record<string, boolean>>({
    queryKey: ['progress', courseId],
    queryFn: async () => {
      const res = await apiClient.get<ProgressResponse>(
        `/api/v1/courses/${courseId}/progress`,
        { token: token ?? undefined }
      );
      return res.data;
    },
    enabled: !!token && !!courseId,
    staleTime: 30_000,
  });

  const markComplete = async (lessonId: string): Promise<void> => {
    await apiClient.post(
      `/api/v1/lessons/${lessonId}/complete`,
      undefined,
      { token: token ?? undefined }
    );
    await queryClient.invalidateQueries({ queryKey: ['progress', courseId] });
  };

  return {
    data: data ?? {},
    isLoading,
    markComplete,
  };
}
