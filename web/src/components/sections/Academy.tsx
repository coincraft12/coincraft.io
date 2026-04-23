import CourseCard from '@/components/courses/course-card';

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
    <section id="academy" className="cc-section bg-cc-secondary/30">
      <div className="cc-container">
        <div className="mb-16">
          <p className="cc-label mb-3">ACADEMY</p>
          <h2 className="text-4xl font-bold text-cc-text mb-3">
            Web3 <span className="text-cc-accent">온라인 강좌</span>
          </h2>
          <p className="text-cc-muted">실무 중심의 단계별 커리큘럼으로 Web3 전문가로 성장하세요.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {courses.map((course) => (
            <CourseCard key={course.id} {...course} showWishlist={false} />
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <a href="/courses" className="cc-btn cc-btn-primary">
            전체 강의 보기
          </a>
        </div>
      </div>
    </section>
  );
}
