import { Suspense } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import CourseCard from '@/components/courses/course-card';
import CourseFilters from '@/components/courses/course-filters';
import Spinner from '@/components/ui/Spinner';

export const metadata = { title: '전체 강좌 — CoinCraft' };
export const revalidate = 60;

interface CourseMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: string;
  category: string | null;
  price: string;
  isFree: boolean;
  totalLessons: number;
  totalDuration: number;
  averageRating: string | null;
  reviewCount: number;
  instructor: { id: string; name: string; avatarUrl: string | null } | null;
}

async function fetchCourses(searchParams: Record<string, string>): Promise<{ data: Course[]; meta: CourseMeta }> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const params = new URLSearchParams();
  if (searchParams.level) params.set('level', searchParams.level);
  if (searchParams.isFree) params.set('isFree', searchParams.isFree);
  if (searchParams.sort) params.set('sort', searchParams.sort);
  if (searchParams.page) params.set('page', searchParams.page);
  if (searchParams.q) params.set('q', searchParams.q);
  params.set('limit', '12');

  const res = await fetch(`${API_BASE}/api/v1/courses?${params}`, { next: { revalidate: 60 } });
  if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } };
  const json = await res.json();
  return json;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { data: courses, meta } = await fetchCourses(params);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-10">
            <p className="cc-label mb-2">COURSES</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">전체 강좌</h1>
            {meta.total > 0 && (
              <p className="text-cc-muted mt-2">총 {meta.total}개의 강좌</p>
            )}
          </div>

          <Suspense fallback={<Spinner className="mx-auto" />}>
            <CourseFilters />
          </Suspense>

          {courses.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🎓</p>
              <p className="text-cc-muted">아직 등록된 강좌가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {courses.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>

              {meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`?page=${p}`}
                      className={`w-9 h-9 flex items-center justify-center rounded-cc text-sm transition-colors ${
                        p === meta.page
                          ? 'bg-cc-accent text-cc-primary font-bold'
                          : 'border border-white/10 text-cc-muted hover:border-cc-accent hover:text-cc-accent'
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
