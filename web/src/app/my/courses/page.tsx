'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

interface EnrollmentItem {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  progressPercent: number;
  enrolledAt: string;
  instructor: { id: string; name: string; avatarUrl: string | null } | null;
}

interface EnrollmentsResponse {
  success: boolean;
  data: EnrollmentItem[];
}

export default function MyCoursesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoading, token, router, pathname]);

  const { data, isLoading } = useQuery<EnrollmentItem[]>({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const res = await apiClient.get<EnrollmentsResponse>('/api/v1/users/me/enrollments', {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token,
  });

  if (isAuthLoading || !token) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-10">
            <p className="cc-label mb-2">MY LEARNING</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">내 강좌</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <p className="text-5xl">🎓</p>
              <p className="text-cc-muted">수강 중인 강좌가 없습니다.</p>
              <Button variant="outline" onClick={() => router.push('/courses')}>
                강좌 둘러보기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {data.map((enrollment) => (
                <div
                  key={enrollment.enrollmentId}
                  className="bg-cc-secondary border border-white/10 rounded-cc overflow-hidden hover:border-cc-accent/40 transition-colors"
                >
                  {/* Thumbnail */}
                  {enrollment.thumbnailUrl ? (
                    <img
                      src={enrollment.thumbnailUrl}
                      alt={enrollment.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                      <span className="text-3xl">🎓</span>
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    {/* Title */}
                    <h3 className="text-cc-text font-semibold text-sm leading-snug line-clamp-2">
                      {enrollment.title}
                    </h3>

                    {/* Instructor */}
                    {enrollment.instructor && (
                      <p className="text-xs text-cc-muted">{enrollment.instructor.name}</p>
                    )}

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-cc-muted mb-1">
                        <span>진도</span>
                        <span>{enrollment.progressPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cc-accent rounded-full transition-all duration-500"
                          style={{ width: `${enrollment.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Continue button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/courses/${enrollment.slug}`)}
                    >
                      이어보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
