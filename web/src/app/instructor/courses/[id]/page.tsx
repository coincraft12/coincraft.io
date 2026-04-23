'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import { revalidateCourse } from '@/lib/revalidate';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import BulkUploadModal from '@/components/ui/BulkUploadModal';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// ─── Drag Handle ──────────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  confirmLabel = '삭제',
  onConfirm,
  onCancel,
  isPending = false,
}: {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-cc-secondary border border-white/20 rounded-cc p-6 max-w-sm w-full mx-4 space-y-4">
        <p className="text-sm text-cc-text">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-cc-muted hover:text-cc-text border border-white/20 rounded transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-1.5 text-sm bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50"
          >
            {isPending ? '삭제 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Lesson ──────────────────────────────────────────────────────────

function SortableLesson({
  lesson,
  chapterId,
  onEdit,
  onDelete,
}: {
  lesson: LessonItem;
  chapterId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
    data: { type: 'lesson', chapterId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between px-6 py-2.5 border-b border-white/5 last:border-0 bg-cc-secondary hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="text-cc-muted/40 hover:text-cc-muted cursor-grab active:cursor-grabbing touch-none select-none"
          tabIndex={-1}
        >
          <GripIcon />
        </button>
        <span className="text-sm text-cc-text">{lesson.title}</span>
        <span className="text-xs text-cc-muted">{typeLabel(lesson.type)}</span>
        {lesson.isPreview && <Badge variant="basic">미리보기</Badge>}
        {!lesson.isPublished && <Badge variant="default">비공개</Badge>}
      </div>
      <div className="flex items-center gap-3">
        {lesson.duration ? (
          <span className="text-xs text-cc-muted">{Math.round(lesson.duration / 60)}분</span>
        ) : null}
        <button onClick={onEdit} className="text-xs text-cc-accent hover:underline">
          수정
        </button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300 transition-colors leading-none" title="레슨 삭제">
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Sortable Chapter ─────────────────────────────────────────────────────────


function SortableChapter({
  chapter,
  courseId,
  isExpanded,
  onToggle,
  onNavigate,
  onDeleteChapter,
  onDeleteLesson,
  onTogglePublish,
  token,
}: {
  chapter: ChapterItem;
  courseId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
  onDeleteChapter: () => void;
  onDeleteLesson: (lessonId: string) => void;
  onTogglePublish: () => void;
  token: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
    data: { type: 'chapter' },
  });

  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
    id: `drop-${chapter.id}`,
    data: { type: 'chapter-drop', chapterId: chapter.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const sortedLessons = [...chapter.lessons].sort((a, b) => a.order - b.order);


  return (
    <div style={style} className="bg-cc-secondary border border-white/10 rounded-cc">
      <div
        ref={setNodeRef}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="text-cc-muted/40 hover:text-cc-muted cursor-grab active:cursor-grabbing touch-none select-none"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <GripIcon />
          </button>
          <span className="text-cc-text font-medium text-sm">{chapter.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePublish(); }}
            className={`text-xs px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
              chapter.isPublished
                ? 'border-green-500/40 text-green-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40'
                : 'border-white/20 text-cc-muted hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/40'
            }`}
          >
            {chapter.isPublished ? '공개' : '비공개'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cc-muted">{chapter.lessons.length}개 레슨</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteChapter(); }}
            className="text-red-400 hover:text-red-300 transition-colors leading-none"
            title="챕터 삭제"
          >
            ✕
          </button>
          <span className="text-cc-muted text-xs">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-white/10">
          <div ref={setDropRef} className={isDropOver ? 'bg-white/5' : ''}>
            <SortableContext
              items={sortedLessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedLessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  chapterId={chapter.id}
                  onEdit={() => onNavigate(`/instructor/lessons/${lesson.id}/edit`)}
                  onDelete={() => onDeleteLesson(lesson.id)}
                />
              ))}
            </SortableContext>
            {sortedLessons.length === 0 && (
              <div className="px-6 py-3 text-xs text-cc-muted">레슨 없음 — 여기에 드롭하거나 추가하세요</div>
            )}
          </div>
          <div className="px-6 py-3 flex items-center gap-4 border-t border-white/5">
            <button
              onClick={() => onNavigate(`/instructor/courses/${courseId}/lessons/new?chapterId=${chapter.id}`)}
              className="text-xs text-cc-accent hover:underline"
            >
              + 레슨 추가
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InstructorCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'students'>('curriculum');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<{ type: 'chapter' | 'lesson'; id: string; label: string } | null>(null);
  const [showCourseDeleteConfirm, setShowCourseDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [activeDragLesson, setActiveDragLesson] = useState<LessonItem | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { data: course, isLoading: courseLoading } = useQuery<CourseDetail>({
    queryKey: ['instructor-course', id],
    queryFn: async () => {
      const res = await apiClient.get<CourseDetailResponse>(`/api/v1/instructor/courses/${id}`, {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token && !!id,
    staleTime: 0,
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
      revalidateCourse(course?.slug);
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/v1/instructor/courses/${id}`, { token: token ?? undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-stats'] });
      fetch('/cache-revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths: ['/courses', '/'] }) });
      window.location.href = '/instructor';
    },
    onError: (err: unknown) => {
      setDeleteError(err instanceof Error ? err.message : '강좌 삭제에 실패했습니다.');
    },
  });

  const duplicateCourse = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: boolean; data: CourseDetail }>(
        `/api/v1/instructor/courses/${id}/duplicate`,
        {},
        { token: token ?? undefined }
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-stats'] });
      router.push(`/instructor/courses/${data.id}`);
    },
    onError: (err: unknown) => {
      setDuplicateError(err instanceof Error ? err.message : '강좌 복제에 실패했습니다.');
    },
  });

  const reorderChapter = useMutation({
    mutationFn: async ({ chapterId, newOrder }: { chapterId: string; newOrder: number }) => {
      await apiClient.put(`/api/v1/instructor/chapters/${chapterId}`, { order: newOrder }, { token: token ?? undefined });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-course', id] }),
  });

  const reorderLesson = useMutation({
    mutationFn: async ({ lessonId, newOrder }: { lessonId: string; newOrder: number }) => {
      await apiClient.put(`/api/v1/instructor/lessons/${lessonId}`, { order: newOrder }, { token: token ?? undefined });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-course', id] }),
  });

  const moveLesson = useMutation({
    mutationFn: async ({ lessonId, chapterId, order }: { lessonId: string; chapterId: string; order: number }) => {
      await apiClient.put(`/api/v1/instructor/lessons/${lessonId}`, { chapterId, order }, { token: token ?? undefined });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-course', id] }),
  });

  const toggleChapterPublish = useMutation({
    mutationFn: async ({ chapterId, isPublished }: { chapterId: string; isPublished: boolean }) => {
      await apiClient.put(`/api/v1/instructor/chapters/${chapterId}`, { isPublished }, { token: token ?? undefined });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-course', id] }),
  });

  const deleteChapter = useMutation({
    mutationFn: async (chapterId: string) => {
      await apiClient.delete(`/api/v1/instructor/chapters/${chapterId}`, { token: token ?? undefined });
    },
    onSuccess: () => {
      setDeleteError('');
      queryClient.invalidateQueries({ queryKey: ['instructor-course', id] });
    },
    onError: (err: unknown) => {
      setDeleteError(err instanceof Error ? err.message : '챕터 삭제에 실패했습니다.');
    },
  });

  const deleteLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      await apiClient.delete(`/api/v1/instructor/lessons/${lessonId}`, { token: token ?? undefined });
    },
    onSuccess: () => {
      setDeleteError('');
      queryClient.invalidateQueries({ queryKey: ['instructor-course', id] });
    },
    onError: (err: unknown) => {
      setDeleteError(err instanceof Error ? err.message : '레슨 삭제에 실패했습니다.');
    },
  });

  function handleConfirmDelete() {
    if (!confirmTarget) return;
    if (confirmTarget.type === 'chapter') deleteChapter.mutate(confirmTarget.id);
    else deleteLesson.mutate(confirmTarget.id);
    setConfirmTarget(null);
  }

  function toggleChapter(chapterId: string) {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'lesson') {
      const chapterId = event.active.data.current.chapterId as string;
      const ch = course?.chapters.find((c) => c.id === chapterId);
      const lesson = ch?.lessons.find((l) => l.id === event.active.id);
      setActiveDragLesson(lesson ?? null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !course) return;
    if (active.id === over.id) return;

    const activeType = active.data.current?.type as string | undefined;

    if (activeType === 'chapter') {
      const sorted = [...course.chapters].sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex((c) => c.id === active.id);
      const newIndex = sorted.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(sorted, oldIndex, newIndex);
      reordered.forEach((chapter, idx) => {
        if (sorted[idx]?.id !== chapter.id) {
          reorderChapter.mutate({ chapterId: chapter.id, newOrder: idx });
        }
      });
      return;
    }

    if (activeType === 'lesson') {
      const sourceChapterId = active.data.current?.chapterId as string;
      const overType = over.data.current?.type as string | undefined;

      let targetChapterId: string | undefined;
      if (overType === 'lesson') {
        targetChapterId = over.data.current?.chapterId as string;
      } else if (overType === 'chapter-drop') {
        targetChapterId = over.data.current?.chapterId as string;
      } else if (overType === 'chapter') {
        targetChapterId = over.id as string;
      }
      if (!targetChapterId) return;

      const sourceChapter = course.chapters.find((c) => c.id === sourceChapterId);
      const targetChapter = course.chapters.find((c) => c.id === targetChapterId);
      if (!sourceChapter || !targetChapter) return;

      if (sourceChapterId === targetChapterId) {
        const sorted = [...sourceChapter.lessons].sort((a, b) => a.order - b.order);
        const oldIndex = sorted.findIndex((l) => l.id === active.id);
        const newIndex = sorted.findIndex((l) => l.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = arrayMove(sorted, oldIndex, newIndex);
        reordered.forEach((lesson, idx) => {
          if (sorted[idx]?.id !== lesson.id) {
            reorderLesson.mutate({ lessonId: lesson.id, newOrder: idx });
          }
        });
      } else {
        const targetSorted = [...targetChapter.lessons].sort((a, b) => a.order - b.order);
        const insertIndex = overType === 'lesson'
          ? targetSorted.findIndex((l) => l.id === over.id)
          : targetSorted.length;
        const newOrder = insertIndex === -1 ? targetSorted.length : insertIndex;
        moveLesson.mutate({ lessonId: active.id as string, chapterId: targetChapterId, order: newOrder });
      }
    }
    setActiveDragLesson(null);
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

  const sortedChapters = [...course.chapters].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {confirmTarget && (
        <ConfirmDialog
          message={`"${confirmTarget.label}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {showCourseDeleteConfirm && (
        <ConfirmDialog
          message={`"${course.title}" 강좌를 삭제하시겠습니까? 챕터, 레슨이 모두 삭제되며 되돌릴 수 없습니다.`}
          confirmLabel="강좌 삭제"
          onConfirm={() => { setShowCourseDeleteConfirm(false); deleteCourse.mutate(); }}
          onCancel={() => setShowCourseDeleteConfirm(false)}
          isPending={deleteCourse.isPending}
        />
      )}

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
            기본정보 수정
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setDuplicateError(''); duplicateCourse.mutate(); }}
            loading={duplicateCourse.isPending}
          >
            강좌 복제
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCourseDeleteConfirm(true)}
            className="text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60"
          >
            강좌 삭제
          </Button>
        </div>
      </div>

      {/* Course-level errors */}
      {(deleteError || duplicateError) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-cc px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-400">{deleteError || duplicateError}</p>
          <button onClick={() => { setDeleteError(''); setDuplicateError(''); }} className="text-red-400 hover:text-red-300 ml-4">✕</button>
        </div>
      )}

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
          {deleteError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-cc px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-red-400">{deleteError}</p>
              <button onClick={() => setDeleteError('')} className="text-red-400 hover:text-red-300 ml-4">✕</button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-cc-text">챕터 / 레슨</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowBulkUpload(true)}>
                ☁️ 일괄 업로드
              </Button>
              <Button size="sm" onClick={() => router.push(`/instructor/courses/${id}/chapters/new`)}>
                + 챕터 추가
              </Button>
            </div>
          </div>

          {sortedChapters.length === 0 ? (
            <div className="text-center py-16 bg-cc-secondary border border-white/10 rounded-cc space-y-3">
              <p className="text-cc-muted">챕터가 없습니다. 챕터를 먼저 추가해 주세요.</p>
              <Button size="sm" onClick={() => router.push(`/instructor/courses/${id}/chapters/new`)}>
                챕터 추가
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedChapters.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sortedChapters.map((chapter) => (
                    <SortableChapter
                      key={chapter.id}
                      chapter={chapter}
                      courseId={id}
                      isExpanded={expandedChapters.has(chapter.id)}
                      onToggle={() => toggleChapter(chapter.id)}
                      onNavigate={(path) => router.push(path)}
                      onTogglePublish={() => toggleChapterPublish.mutate({ chapterId: chapter.id, isPublished: !chapter.isPublished })}
                      onDeleteChapter={() => setConfirmTarget({ type: 'chapter', id: chapter.id, label: chapter.title })}
                      onDeleteLesson={(lessonId) => {
                        const lesson = chapter.lessons.find((l) => l.id === lessonId);
                        setConfirmTarget({ type: 'lesson', id: lessonId, label: lesson?.title ?? lessonId });
                      }}
                      token={token}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeDragLesson ? (
                  <div className="flex items-center justify-between px-6 py-2.5 bg-cc-secondary border border-white/20 rounded shadow-xl opacity-95 cursor-grabbing">
                    <div className="flex items-center gap-3">
                      <span className="text-cc-muted/40"><GripIcon /></span>
                      <span className="text-sm text-cc-text">{activeDragLesson.title}</span>
                      <span className="text-xs text-cc-muted">{typeLabel(activeDragLesson.type)}</span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
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

      {showBulkUpload && (
        <BulkUploadModal
          token={token!}
          courseId={id}
          chapters={sortedChapters.map((c) => ({ id: c.id, title: c.title }))}
          onClose={() => setShowBulkUpload(false)}
          onGenerated={() => {
            setShowBulkUpload(false);
            queryClient.invalidateQueries({ queryKey: ['instructor-course', id] });
          }}
        />
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
