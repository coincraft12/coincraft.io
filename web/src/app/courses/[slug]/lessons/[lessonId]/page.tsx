'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import LessonSidebar from '@/components/lms/lesson-sidebar';
import VideoPlayer from '@/components/lms/video-player';
import MarkdownContent from '@/components/ui/MarkdownContent';
import { QASection } from '@/components/lms/qa-section';
import { LessonReviewsSection } from '@/components/lms/lesson-reviews-section';

interface Material {
  id: string;
  title: string;
  fileUrl: string;
  fileSize: number | null;
  fileType: string | null;
  order: number;
}

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
  watchedSeconds: number;
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

type TabKey = '강의노트' | '자료' | '강평' | 'Q&A';
const TABS: TabKey[] = ['강의노트', '자료', '강평', 'Q&A'];

function findNextLessonId(chapters: Chapter[], currentLessonId: string): string | null {
  const allLessons = [...chapters]
    .sort((a, b) => a.order - b.order)
    .flatMap((ch) => [...ch.lessons].sort((a, b) => a.order - b.order));
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex === -1 || currentIndex === allLessons.length - 1) return null;
  return allLessons[currentIndex + 1].id;
}

function findLessonMeta(
  chapters: Chapter[],
  lessonId: string
): { lessonOrder: number; chapterOrder: number } | null {
  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      return { lessonOrder: lesson.order, chapterOrder: chapter.order };
    }
  }
  return null;
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}분 ${String(s).padStart(2, '0')}초`;
}

export default function LessonPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ slug: string; lessonId: string }>();
  const { slug, lessonId } = params;

  const token = useAuthStore((s) => s.accessToken);
  const isLoading = useAuthStore((s) => s.isLoading);
  const queryClient = useQueryClient();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('강의노트');
  const [materials, setMaterials] = useState<Material[]>([]);

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

      const [progressRes, materialsRes] = await Promise.all([
        lessonRes.data.courseId
          ? apiClient.get<ProgressResponse>(`/api/v1/courses/${lessonRes.data.courseId}/progress`, { token })
          : Promise.resolve(null),
        apiClient.get<{ success: boolean; data: Material[] }>(`/api/v1/courses/${slug}/lessons/${lessonId}/materials`, { token }).catch(() => null),
      ]);
      if (progressRes) setProgress(progressRes.data);
      if (materialsRes) setMaterials(materialsRes.data);
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
  }, [token, slug, lessonId, router, pathname]);

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
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });

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

  const lessonMeta = findLessonMeta(course.chapters, lesson.id);
  const durationText = formatDuration(lesson.duration);

  return (
    <div className="min-h-screen bg-cc-primary flex flex-col">
      {/* ── Top navigation bar ── */}
      <header className="flex-shrink-0 h-12 border-b border-white/10 flex items-center justify-between px-4 bg-cc-primary z-10">
        {/* Left: logo + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-cc-accent tracking-tight whitespace-nowrap">
            CoinCraft
          </span>
          <span className="text-white/20 text-sm">/</span>
          <span className="text-sm text-cc-muted truncate max-w-xs">
            {course.title}
          </span>
        </div>

        {/* Right: close button */}
        <button
          onClick={() => router.push(`/courses/${slug}`)}
          className="flex-shrink-0 ml-4 text-cc-muted hover:text-cc-text transition-colors"
          aria-label="강좌로 나가기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── Main body: content left + sidebar right ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
            {/* Video / text content */}
            {lesson.type === 'video' && lesson.embedUrl ? (
              <div className="relative w-full aspect-video bg-black rounded-cc overflow-hidden">
                <VideoPlayer
                  lessonId={lesson.id}
                  embedUrl={lesson.embedUrl}
                  videoProvider={lesson.videoProvider}
                  initialSeconds={lesson.watchedSeconds}
                  token={token!}
                />
              </div>
            ) : lesson.type === 'text' && lesson.textContent ? (
              <div className="prose prose-invert max-w-none text-cc-muted leading-relaxed">
                <MarkdownContent content={lesson.textContent} />
              </div>
            ) : (
              <div className="aspect-video bg-white/5 rounded-cc flex items-center justify-center">
                <p className="text-cc-muted">콘텐츠를 불러올 수 없습니다.</p>
              </div>
            )}

            {/* ── Meta info below video ── */}
            <div className="space-y-1.5">
              {lessonMeta && (
                <p className="text-xs text-cc-muted uppercase tracking-widest">
                  Lesson {lessonMeta.lessonOrder} · Chapter {lessonMeta.chapterOrder}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-cc-text leading-tight">
                {lesson.title}
              </h1>
              {durationText && (
                <p className="text-sm text-cc-muted">{durationText}</p>
              )}
            </div>

            {/* ── Tab menu ── */}
            <div className="border-b border-white/10">
              <nav className="flex gap-0">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-cc-accent text-cc-accent'
                        : 'border-transparent text-cc-muted hover:text-cc-text'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab content */}
            {activeTab === '강의노트' && lesson.textContent && (
              <div className="prose prose-invert max-w-none text-cc-muted leading-relaxed pb-4">
                <MarkdownContent content={lesson.textContent} />
              </div>
            )}
            {activeTab === '강의노트' && !lesson.textContent && (
              <p className="text-cc-muted text-sm pb-4">강의 내용이 없습니다.</p>
            )}
            {activeTab === '자료' && (
              <div className="pb-4">
                {materials.length === 0 ? (
                  <p className="text-cc-muted text-sm">등록된 자료가 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {materials.map((m) => (
                      <li key={m.id}>
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-cc-accent text-lg">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-cc-text truncate">{m.title}</p>
                            {m.fileSize && (
                              <p className="text-xs text-cc-muted mt-0.5">
                                {m.fileSize < 1024 * 1024
                                  ? `${(m.fileSize / 1024).toFixed(1)} KB`
                                  : `${(m.fileSize / 1024 / 1024).toFixed(1)} MB`}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-cc-muted group-hover:text-cc-accent transition-colors shrink-0">다운로드 ↓</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {activeTab === '강평' && (
              <div className="pb-4">
                <LessonReviewsSection lessonId={lesson.id} />
              </div>
            )}
            {activeTab === 'Q&A' && (
              <div className="pb-4">
                <QASection
                  lessonId={lesson.id}
                  courseId={lesson.courseId}
                  courseName={course.title}
                  lessonTitle={lesson.title}
                />
              </div>
            )}

            {/* Complete / navigation */}
            <div className="flex items-center justify-between border-t border-white/10 pt-6 pb-8">
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

        {/* ── Sidebar right ── */}
        <aside className="hidden lg:block w-80 flex-shrink-0 border-l border-white/10 overflow-y-auto">
          <LessonSidebar
            chapters={course.chapters}
            currentLessonId={lesson.id}
            courseSlug={slug}
            courseTitle={course.title}
            progress={progress}
          />
        </aside>
      </div>
    </div>
  );
}
