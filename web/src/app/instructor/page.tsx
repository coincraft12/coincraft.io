'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="cc-label mb-1">INSTRUCTOR</p>
          <h1 className="text-3xl font-bold text-cc-text">대시보드</h1>
        </div>
        <Button onClick={() => router.push('/instructor/courses/new')}>+ 강좌 만들기</Button>
      </div>

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
                      <button
                        onClick={() => router.push(`/instructor/courses/${c.courseId}`)}
                        className="text-xs text-cc-accent hover:underline"
                      >
                        상세보기
                      </button>
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
