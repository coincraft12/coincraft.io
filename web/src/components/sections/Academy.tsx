import CourseCard from '@/components/courses/course-card';
import SectionReveal from '@/components/ui/SectionReveal';

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

async function fetchFeaturedCourses(): Promise<Course[]> {
  const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4001';
  try {
    const res = await fetch(`${API_BASE}/api/v1/courses?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function Academy() {
  const courses = await fetchFeaturedCourses();

  return (
    <section id="academy" className="relative py-24 md:py-36 overflow-hidden bg-cc-primary">
      {/* Top divider glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cc-accent/25 to-transparent pointer-events-none" />

      {/* Ambient center glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-cc-accent/4 rounded-full blur-[120px] pointer-events-none" />

      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay pointer-events-none opacity-20" />

      <div className="cc-container relative z-10">
        <SectionReveal className="mb-16 md:mb-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="cc-label mb-3">ACADEMY</p>
              <h2 className="text-4xl md:text-5xl font-black text-cc-text leading-tight">
                Web3{' '}
                <span className="text-cc-accent glow-text">온라인 강좌</span>
              </h2>
            </div>
            <p className="text-cc-muted text-sm md:text-base max-w-xs leading-relaxed">
              실무 중심의 단계별 커리큘럼으로<br className="hidden md:block" />
              Web3 전문가로 성장하세요.
            </p>
          </div>
          <div className="mt-6 h-px bg-gradient-to-r from-cc-accent/60 via-cc-accent/15 to-transparent" />
        </SectionReveal>

        {courses.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {courses.map((course, i) => (
              <SectionReveal key={course.id} delay={i * 100}>
                <CourseCard {...course} showWishlist={false} />
              </SectionReveal>
            ))}
          </div>
        ) : (
          <SectionReveal className="mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="cc-glass rounded-cc-lg h-72 animate-pulse opacity-40" />
              ))}
            </div>
          </SectionReveal>
        )}

        <SectionReveal delay={300}>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/courses" className="cc-btn cc-btn-primary btn-shimmer">전체 강의 보기</a>
            <span className="text-cc-muted text-sm">7+ 커리큘럼 · Basic부터 Expert까지</span>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
