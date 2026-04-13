'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonItem {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  isPreview: boolean;
  isPublished: boolean;
  order: number;
}

interface ChapterItem {
  id: string;
  title: string;
  order: number;
  isPublished: boolean;
  lessons: LessonItem[];
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  level: string;
  category: string | null;
  price: string;
  isFree: boolean;
  isPublished: boolean;
  totalLessons: number;
  totalDuration: number;
  enrollmentCount: number;
  chapters: ChapterItem[];
}

interface StudentItem {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  enrolledAt: string;
  progressPercent: number;
  status: string;
}

interface CourseDetailResponse { success: boolean; data: CourseDetail }
interface StudentsResponse { success: boolean; data: StudentItem[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelLabel(level: string): string {
  switch (level) {
    case 'beginner': return '입문';
    case 'intermediate': return '중급';
    case 'advanced': return '고급';
    default: return level;
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'video': return '영상';
    case 'text': return '텍스트';
    case 'quiz': return '퀴즈';
    default: return type;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InstructorCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'students'>('curriculum');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const { data: course, isLoading: courseLoading } = useQuery<CourseDetail>({
    queryKey: ['instructor-course', id],
    queryFn: async () => {
      const res = await apiClient.get<CourseDetailResponse>(`/api/v1/instructor/courses/${id}`, {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token && !!id,
  });

  const { data: students, isLoading: studentsLoading } = useQuery<StudentItem[]>({
    queryKey: ['instructor-course-students', id],
    queryFn: async () => {
      const res = await apiClient.get<StudentsResponse>(`/api/v1/instructor/courses/${id}/students`, {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token && !!id && activeTab === 'students',
  });

  const togglePublish = useMutation({
    mutationFn: async () => {
      await apiClient.put(
        `/api/v1/instructor/courses/${id}`,
        { isPublished: !course?.isPublished },
        { token: token ?? undefined }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-course', id] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
  });

  function toggleChapter(chapterId: string) {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }

  if (courseLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-24">
        <p className="text-cc-muted">강좌를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={course.isPublished ? 'success' : 'default'}>
              {course.isPublished ? '공개' : '비공개'}
            </Badge>
            <Badge variant="default">{levelLabel(course.level)}</Badge>
            {course.isFree && <Badge variant="basic">무료</Badge>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-cc-text">{course.title}</h1>
          {course.shortDescription && (
            <p className="text-cc-muted">{course.shortDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePublish.mutate()}
            loading={togglePublish.isPending}
          >
            {course.isPublished ? '비공개로 전환' : '공개하기'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/instructor/courses/${id}/edit`)}
          >
            수정
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickStat label="챕터" value={`${course.chapters.length}개`} />
        <QuickStat label="총 레슨" value={`${course.totalLessons}개`} />
        <QuickStat label="수강생" value={`${course.enrollmentCount}명`} />
        <QuickStat
          label="가격"
          value={course.isFree ? '무료' : `${Number(course.price).toLocaleString()}원`}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 flex gap-6">
        {(['curriculum', 'students'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-cc-accent text-cc-text'
                : 'border-transparent text-cc-muted hover:text-cc-text'
            }`}
          >
            {tab === 'curriculum' ? '커리큘럼' : '수강생'}
          </button>
        ))}
      </div>

      {/* Curriculum tab */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-cc-text">챕터 / 레슨</h2>
            <Button size="sm" onClick={() => router.push(`/instructor/courses/${id}/chapters/new`)}>
              + 챕터 추가
            </Button>
          </div>

          {course.chapters.length === 0 ? (
            <div className="text-center py-16 bg-cc-secondary border border-white/10 rounded-cc space-y-3">
              <p className="text-cc-muted">챕터가 없습니다. 챕터를 먼저 추가해 주세요.</p>
              <Button size="sm" onClick={() => router.push(`/instructor/courses/${id}/chapters/new`)}>
                챕터 추가
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {course.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="bg-cc-secondary border border-white/10 rounded-cc overflow-hidden"
                >
                  {/* Chapter header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cc-muted text-sm">{chapter.order + 1}.</span>
                      <span className="text-cc-text font-medium text-sm">{chapter.title}</span>
                      {!chapter.isPublished && (
                        <Badge variant="default">비공개</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-cc-muted">{chapter.lessons.length}개 레슨</span>
                      <span className="text-cc-muted text-xs">
                        {expandedChapters.has(chapter.id) ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Lessons */}
                  {expandedChapters.has(chapter.id) && (
                    <div className="border-t border-white/10">
                      {chapter.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between px-6 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-cc-muted w-5 text-center">{lesson.order + 1}</span>
                            <span className="text-sm text-cc-text">{lesson.title}</span>
                            <span className="text-xs text-cc-muted">{typeLabel(lesson.type)}</span>
                            {lesson.isPreview && <Badge variant="basic">미리보기</Badge>}
                            {!lesson.isPublished && <Badge variant="default">비공개</Badge>}
                          </div>
                          <div className="flex items-center gap-3">
                            {lesson.duration ? (
                              <span className="text-xs text-cc-muted">{Math.round(lesson.duration / 60)}분</span>
                            ) : null}
                            <button
                              onClick={() => router.push(`/instructor/lessons/${lesson.id}/edit`)}
                              className="text-xs text-cc-accent hover:underline"
                            >
                              수정
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="px-6 py-3">
                        <button
                          onClick={() => router.push(`/instructor/courses/${id}/lessons/new?chapterId=${chapter.id}`)}
                          className="text-xs text-cc-accent hover:underline"
                        >
                          + 레슨 추가
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Students tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-cc-text">수강생 목록</h2>
          {studentsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !students || students.length === 0 ? (
            <div className="text-center py-16 bg-cc-secondary border border-white/10 rounded-cc">
              <p className="text-cc-muted">아직 수강생이 없습니다.</p>
            </div>
          ) : (
            <div className="bg-cc-secondary border border-white/10 rounded-cc overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-cc-muted text-left">
                    <th className="px-4 py-3 font-medium">이름</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">이메일</th>
                    <th className="px-4 py-3 font-medium text-right">진도</th>
                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">수강일</th>
                    <th className="px-4 py-3 font-medium text-right">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.userId} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} alt={s.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-cc-muted">
                              {s.name[0]}
                            </div>
                          )}
                          <span className="text-cc-text">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-cc-muted hidden sm:table-cell">{s.email}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cc-accent rounded-full"
                              style={{ width: `${s.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-cc-muted text-xs">{s.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-cc-muted text-right hidden sm:table-cell text-xs">
                        {new Date(s.enrolledAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                          {s.status === 'active' ? '수강중' : s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cc-secondary border border-white/10 rounded-cc px-4 py-3 space-y-1">
      <p className="text-xs text-cc-muted">{label}</p>
      <p className="text-lg font-bold text-cc-text">{value}</p>
    </div>
  );
}
