'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

interface CourseStatItem {
  courseId: string;
  title: string;
  slug: string;
  enrollmentCount: number;
  revenue: string;
}

interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: string;
  courseStats: CourseStatItem[];
}

interface StatsResponse {
  success: boolean;
  data: InstructorStats;
}

export default function InstructorDashboardPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [confirmDelete, setConfirmDelete] = useState<CourseStatItem | null>(null);
  const [actionError, setActionError] = useState('');

  const { data: stats, isLoading } = useQuery<InstructorStats>({
    queryKey: ['instructor-stats'],
    queryFn: async () => {
      const res = await apiClient.get<StatsResponse>('/api/v1/instructor/stats', {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token,
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      await apiClient.delete(`/api/v1/instructor/courses/${courseId}`, { token: token ?? undefined });
    },
    onSuccess: () => {
      setConfirmDelete(null);
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['instructor-stats'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      fetch('/cache-revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths: ['/courses', '/'] }) });
    },
    onError: (err: unknown) => {
      setConfirmDelete(null);
      setActionError(err instanceof Error ? err.message : '강좌 삭제에 실패했습니다.');
    },
  });

  const duplicateCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await apiClient.post<{ success: boolean; data: { id: string } }>(
        `/api/v1/instructor/courses/${courseId}/duplicate`,
        {},
        { token: token ?? undefined }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-stats'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : '강좌 복제에 실패했습니다.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 삭제 확인 다이얼로그 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-cc-secondary border border-white/20 rounded-cc p-6 max-w-sm w-full mx-4 space-y-4">
            <p className="text-sm text-cc-text">
              &quot;{confirmDelete.title}&quot; 강좌를 삭제하시겠습니까?<br />
              챕터, 레슨이 모두 삭제되며 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-1.5 text-sm text-cc-muted hover:text-cc-text border border-white/20 rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteCourse.mutate(confirmDelete.courseId)}
                disabled={deleteCourse.isPending}
                className="px-4 py-1.5 text-sm bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50"
              >
                {deleteCourse.isPending ? '삭제 중...' : '강좌 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="cc-label mb-1">INSTRUCTOR</p>
          <h1 className="text-3xl font-bold text-cc-text">대시보드</h1>
        </div>
        <Button onClick={() => router.push('/instructor/courses/new')}>+ 강좌 만들기</Button>
      </div>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-cc px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-400">{actionError}</p>
          <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-300 ml-4">✕</button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="총 강좌" value={String(stats?.totalCourses ?? 0)} unit="개" />
        <StatCard label="총 수강생" value={String(stats?.totalStudents ?? 0)} unit="명" />
        <StatCard
          label="총 매출"
          value={Number(stats?.totalRevenue ?? 0).toLocaleString()}
          unit="원"
        />
      </div>

      {/* Per-course stats */}
      {stats && stats.courseStats.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-cc-text mb-4">강좌별 현황</h2>
          <div className="bg-cc-secondary border border-white/10 rounded-cc overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-cc-muted text-left">
                  <th className="px-4 py-3 font-medium">강좌명</th>
                  <th className="px-4 py-3 font-medium text-right">수강생</th>
                  <th className="px-4 py-3 font-medium text-right">매출</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {stats.courseStats.map((c) => (
                  <tr key={c.courseId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-cc-text">{c.title}</td>
                    <td className="px-4 py-3 text-cc-muted text-right">{c.enrollmentCount}명</td>
                    <td className="px-4 py-3 text-cc-muted text-right">
                      {Number(c.revenue).toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => router.push(`/instructor/courses/${c.courseId}`)}
                          className="text-xs text-cc-accent hover:underline"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateCourse.mutate(c.courseId); }}
                          disabled={duplicateCourse.isPending}
                          className="text-xs text-cc-muted hover:text-cc-accent transition-colors disabled:opacity-40"
                        >
                          복제
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(c); }}
                          className="text-red-500 hover:text-red-400 transition-colors leading-none"
                          title="강좌 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!stats || stats.courseStats.length === 0) && !isLoading && (
        <div className="text-center py-20 space-y-4">
          <p className="text-cc-muted">아직 강좌가 없습니다.</p>
          <Button onClick={() => router.push('/instructor/courses/new')}>첫 강좌 만들기</Button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-2">
      <p className="text-xs text-cc-muted uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-cc-text">
        {value}
        <span className="text-base font-normal text-cc-muted ml-1">{unit}</span>
      </p>
    </div>
  );
}
