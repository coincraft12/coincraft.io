'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import LessonSidebar from '@/components/lms/lesson-sidebar';

interface Lesson {
  id: string;
  title: string;
  type: string;
  videoProvider: string | null;
  embedUrl: string | null;
  textContent: string | null;
  duration: number | null;
  isPreview: boolean;
  courseId: string;
  chapterId: string;
}

interface LessonSimple {
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
  lessons: LessonSimple[];
}

interface CourseData {
  id: string;
  slug: string;
  title: string;
  chapters: Chapter[];
}

interface LessonResponse {
  success: boolean;
  data: Lesson;
}

interface CourseResponse {
  success: boolean;
  data: CourseData;
}

interface ProgressResponse {
  success: boolean;
  data: Record<string, boolean>;
}

function findNextLessonId(chapters: Chapter[], currentLessonId: string): string | null {
  const allLessons = chapters.flatMap((ch) => ch.lessons).sort((a, b) => a.order - b.order);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex === -1 || currentIndex === allLessons.length - 1) return null;
  return allLessons[currentIndex + 1].id;
}

export default function LessonPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ slug: string; lessonId: string }>();
  const { slug, lessonId } = params;

  const token = useAuthStore((s) => s.accessToken);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setPageLoading(true);
    setError(null);
    try {
      const [lessonRes, courseRes] = await Promise.all([
        apiClient.get<LessonResponse>(`/api/v1/courses/${slug}/lessons/${lessonId}`, { token }),
        apiClient.get<CourseResponse>(`/api/v1/courses/${slug}`, { token }),
      ]);
      setLesson(lessonRes.data);
      setCourse(courseRes.data);

      if (lessonRes.data.courseId) {
        const progressRes = await apiClient.get<ProgressResponse>(
          `/api/v1/courses/${lessonRes.data.courseId}/progress`,
          { token }
        );
        setProgress(progressRes.data);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        setError('이 레슨에 접근할 권한이 없습니다. 먼저 수강 신청하세요.');
      } else {
        setError('레슨을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setPageLoading(false);
    }
  }, [token, slug, lessonId, router]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isLoading, token, fetchData, router]);

  const handleComplete = async () => {
    if (!lesson || !token) return;
    setCompleting(true);
    try {
      await apiClient.post(`/api/v1/lessons/${lesson.id}/complete`, undefined, { token });
      setProgress((prev) => ({ ...prev, [lesson.id]: true }));

      // Navigate to next lesson
      if (course) {
        const nextId = findNextLessonId(course.chapters, lesson.id);
        if (nextId) {
          router.push(`/courses/${slug}/lessons/${nextId}`);
        }
      }
    } catch {
      // silent — progress update failure is non-critical
    } finally {
      setCompleting(false);
    }
  };

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cc-primary flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error}</p>
        <Button variant="outline" onClick={() => router.push(`/courses/${slug}`)}>
          강좌로 돌아가기
        </Button>
      </div>
    );
  }

  if (!lesson || !course) return null;

  return (
    <div className="min-h-screen bg-cc-primary flex">
      {/* Sidebar (1/4) */}
      <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-white/10 overflow-y-auto">
        <LessonSidebar
          chapters={course.chapters}
          currentLessonId={lesson.id}
          courseSlug={slug}
          progress={progress}
        />
      </aside>

      {/* Main content (3/4) */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Lesson title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-cc-text">{lesson.title}</h1>
          </div>

          {/* Video or text content */}
          {lesson.type === 'video' && lesson.embedUrl ? (
            <div className="relative w-full aspect-video bg-black rounded-cc overflow-hidden">
              <iframe
                src={lesson.embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          ) : lesson.type === 'text' && lesson.textContent ? (
            <div
              className="prose prose-invert max-w-none text-cc-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: lesson.textContent }}
            />
          ) : (
            <div className="aspect-video bg-white/5 rounded-cc flex items-center justify-center">
              <p className="text-cc-muted">콘텐츠를 불러올 수 없습니다.</p>
            </div>
          )}

          {/* Complete button */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/courses/${slug}`)}
            >
              강좌로 돌아가기
            </Button>

            {progress[lesson.id] ? (
              <span className="text-cc-accent font-semibold">✅ 완료</span>
            ) : (
              <Button
                variant="primary"
                loading={completing}
                onClick={handleComplete}
              >
                완료 표시
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
