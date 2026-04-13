import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import CurriculumAccordion from '@/components/courses/curriculum-accordion';
import EnrollButton from '@/components/courses/enroll-button';

export const revalidate = 300;

const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4001';

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

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
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
  isEnrolled: boolean;
  chapters: Chapter[];
}

async function fetchCourseDetail(slug: string): Promise<CourseDetail | null> {
  const res = await fetch(`${API_BASE}/api/v1/courses/${slug}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const json = await res.json() as { success: boolean; data: CourseDetail };
  return json.data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await fetchCourseDetail(slug);
  if (!course) return { title: '강좌 — CoinCraft' };
  return {
    title: `${course.title} — CoinCraft`,
    description: course.shortDescription ?? course.description ?? undefined,
    openGraph: {
      title: course.title,
      description: course.shortDescription ?? course.description ?? '',
      images: course.thumbnailUrl ? [{ url: course.thumbnailUrl }] : [],
    },
  };
}

function levelLabel(level: string): string {
  switch (level) {
    case 'beginner': return '입문';
    case 'intermediate': return '중급';
    case 'advanced': return '고급';
    default: return level;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await fetchCourseDetail(slug);
  if (!course) notFound();

  const firstLessonId = course.chapters[0]?.lessons[0]?.id;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: main content (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & meta */}
              <div>
                {course.category && (
                  <p className="cc-label mb-2">{course.category.toUpperCase()}</p>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-cc-text mb-3">{course.title}</h1>
                {course.shortDescription && (
                  <p className="text-cc-muted text-lg leading-relaxed">{course.shortDescription}</p>
                )}
              </div>

              {/* Instructor */}
              {course.instructor && (
                <div className="flex items-center gap-3">
                  {course.instructor.avatarUrl && (
                    <img
                      src={course.instructor.avatarUrl}
                      alt={course.instructor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-xs text-cc-muted">강사</p>
                    <p className="text-cc-text font-semibold">{course.instructor.name}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {course.description && (
                <div>
                  <h2 className="text-xl font-bold text-cc-text mb-3">강좌 소개</h2>
                  <p className="text-cc-muted leading-relaxed whitespace-pre-line">{course.description}</p>
                </div>
              )}

              {/* Curriculum */}
              {course.chapters.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-cc-text mb-4">커리큘럼</h2>
                  <CurriculumAccordion
                    chapters={course.chapters}
                    courseSlug={course.slug}
                    isEnrolled={false}
                  />
                </div>
              )}
            </div>

            {/* Right: sidebar (1/3) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-5">
                {/* Thumbnail */}
                {course.thumbnailUrl && (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full aspect-video object-cover rounded-cc"
                  />
                )}

                {/* Price */}
                <div className="text-center">
                  {course.isFree ? (
                    <span className="text-2xl font-bold text-cc-accent">무료</span>
                  ) : (
                    <span className="text-2xl font-bold text-cc-text">
                      {Number(course.price).toLocaleString()}원
                    </span>
                  )}
                </div>

                {/* Enroll button */}
                <EnrollButton
                  courseId={course.id}
                  isFree={course.isFree}
                  price={Number(course.price).toLocaleString()}
                  isEnrolled={false}
                  firstLessonId={firstLessonId}
                  courseSlug={course.slug}
                />

                {/* Meta info */}
                <div className="space-y-2 text-sm text-cc-muted border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <span>난이도</span>
                    <span className="text-cc-text">{levelLabel(course.level)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>총 강의 수</span>
                    <span className="text-cc-text">{course.totalLessons}개</span>
                  </div>
                  {course.totalDuration > 0 && (
                    <div className="flex justify-between">
                      <span>총 재생 시간</span>
                      <span className="text-cc-text">{Math.round(course.totalDuration / 60)}분</span>
                    </div>
                  )}
                  {course.averageRating && Number(course.averageRating) > 0 && (
                    <div className="flex justify-between">
                      <span>평점</span>
                      <span className="text-cc-text">★ {Number(course.averageRating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
