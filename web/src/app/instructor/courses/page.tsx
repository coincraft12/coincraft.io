'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface InstructorCourse {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: string;
  category: string | null;
  price: string;
  isFree: boolean;
  isPublished: boolean;
  totalLessons: number;
  totalDuration: number;
  enrollmentCount: number;
  createdAt: string;
}

interface CoursesResponse {
  success: boolean;
  data: InstructorCourse[];
}

function levelLabel(level: string): string {
  switch (level) {
    case 'beginner': return '입문';
    case 'intermediate': return '중급';
    case 'advanced': return '고급';
    default: return level;
  }
}

export default function InstructorCoursesPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  const { data: courses, isLoading } = useQuery<InstructorCourse[]>({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await apiClient.get<CoursesResponse>('/api/v1/instructor/courses', {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="cc-label mb-1">INSTRUCTOR</p>
          <h1 className="text-3xl font-bold text-cc-text">내 강좌</h1>
        </div>
        <Button onClick={() => router.push('/instructor/courses/new')}>+ 강좌 만들기</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : !courses || courses.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <p className="text-cc-muted">등록된 강좌가 없습니다.</p>
          <Button onClick={() => router.push('/instructor/courses/new')}>첫 강좌 만들기</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-cc-secondary border border-white/10 rounded-cc overflow-hidden hover:border-cc-accent/40 transition-colors cursor-pointer"
              onClick={() => router.push(`/instructor/courses/${course.id}`)}
            >
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                  <span className="text-3xl">🎓</span>
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={course.isPublished ? 'success' : 'default'}>
                    {course.isPublished ? '공개' : '비공개'}
                  </Badge>
                  <Badge variant="default">{levelLabel(course.level)}</Badge>
                  {course.isFree && <Badge variant="basic">무료</Badge>}
                </div>
                <h3 className="text-cc-text font-semibold text-sm leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-cc-muted">
                  <span>레슨 {course.totalLessons}개</span>
                  <span>수강생 {course.enrollmentCount}명</span>
                </div>
                <div className="text-sm font-semibold text-cc-text">
                  {course.isFree ? '무료' : `${Number(course.price).toLocaleString()}원`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
