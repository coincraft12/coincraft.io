import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import CourseCard from '@/components/courses/course-card';

export const revalidate = 300;

const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4001';

interface InstructorDetail {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  career: string | null;
  photoUrl: string | null;
  specialties: string[];
  courses: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string | null;
    thumbnailUrl: string | null;
    level: string;
    category: string | null;
    price: string;
    originalPrice: string | null;
    isFree: boolean;
    totalLessons: number;
    totalDuration: number;
    averageRating: string | null;
    reviewCount: number;
  }[];
}

async function fetchInstructor(id: string): Promise<InstructorDetail | null> {
  const res = await fetch(`${API_BASE}/api/v1/instructors/${id}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const json = await res.json() as { success: boolean; data: InstructorDetail };
  return json.data ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const instructor = await fetchInstructor(id);
  if (!instructor) return { title: '강사 — COINCRAFT' };
  return {
    title: `${instructor.name} — COINCRAFT`,
    description: instructor.bio?.slice(0, 160) ?? undefined,
  };
}

export default async function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const instructor = await fetchInstructor(id);
  if (!instructor) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-4xl">
          {/* Profile */}
          <div className="bg-cc-secondary border border-white/10 rounded-cc p-8 mb-10">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white flex-shrink-0 flex items-center justify-center text-4xl">
                {instructor.photoUrl ? (
                  <img src={instructor.photoUrl} alt={instructor.name} className="w-full h-full object-contain scale-110" />
                ) : (
                  '👤'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="cc-label mb-1">INSTRUCTOR</p>
                <h1 className="text-3xl font-bold text-cc-text mb-3">{instructor.name}</h1>
                {instructor.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {instructor.specialties.map((s) => (
                      <span key={s} className="text-xs bg-cc-accent/20 text-cc-accent px-3 py-1 rounded-full border border-cc-accent/20">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {instructor.bio && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h2 className="text-sm font-semibold text-cc-muted uppercase tracking-wider mb-3">소개</h2>
                <p className="text-cc-text text-sm leading-relaxed whitespace-pre-line">{instructor.bio}</p>
              </div>
            )}

            {instructor.career && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h2 className="text-sm font-semibold text-cc-muted uppercase tracking-wider mb-3">경력</h2>
                <p className="text-cc-text text-sm leading-relaxed whitespace-pre-line">{instructor.career}</p>
              </div>
            )}
          </div>

          {/* Courses */}
          {instructor.courses.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-cc-text mb-6">강좌 ({instructor.courses.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {instructor.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    {...course}
                    instructor={{ id: instructor.userId, name: instructor.name, avatarUrl: instructor.photoUrl, bio: null, specialties: null, photoUrl: null }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
