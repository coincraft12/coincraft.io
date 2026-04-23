'use client';

import Link from 'next/link';

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

interface LessonSidebarProps {
  chapters: Chapter[];
  currentLessonId: string;
  courseSlug: string;
  courseTitle: string;
  progress: Record<string, boolean>;
}

function calcProgress(
  chapters: Chapter[],
  progress: Record<string, boolean>
): { completed: number; total: number; percent: number } {
  const allLessons = chapters.flatMap((ch) => ch.lessons);
  const total = allLessons.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = allLessons.filter((l) => progress[l.id]).length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LessonSidebar({
  chapters,
  currentLessonId,
  courseSlug,
  courseTitle,
  progress,
}: LessonSidebarProps) {
  const { completed, total, percent } = calcProgress(chapters, progress);

  return (
    <div className="flex flex-col h-full bg-cc-primary">
      {/* Course title + progress */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10 space-y-3">
        <p className="text-xs font-semibold text-cc-muted uppercase tracking-widest truncate">
          {courseTitle}
        </p>
        <div className="flex justify-between text-xs text-cc-muted">
          <span>
            {completed} / {total} lessons · {percent}%
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-cc-accent rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Chapter & lesson list */}
      <div className="flex-1 overflow-y-auto py-2">
        {chapters.map((chapter) => (
          <div key={chapter.id}>
            {/* Chapter header: 01 - FOUNDATIONS */}
            <p className="px-4 pt-4 pb-1.5 text-xs font-bold text-cc-muted uppercase tracking-widest">
              {String(chapter.order).padStart(2, '0')} — {chapter.title.toUpperCase()}
            </p>
            <ul>
              {chapter.lessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                const isCompleted = progress[lesson.id] === true;

                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/courses/${courseSlug}/lessons/${lesson.id}`}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/20 border-r-2 border-blue-500 text-white'
                          : 'text-cc-muted hover:bg-white/5 hover:text-cc-text'
                      }`}
                    >
                      {/* Status icon */}
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {isCompleted ? (
                          /* Green check circle */
                          <svg
                            className="w-5 h-5 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : isCurrent ? (
                          /* Blue filled circle for current */
                          <svg
                            className="w-4 h-4 text-blue-500"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <circle cx="8" cy="8" r="8" />
                          </svg>
                        ) : (
                          /* Empty circle for not started */
                          <svg
                            className="w-4 h-4 text-white/20"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <circle cx="8" cy="8" r="6.5" />
                          </svg>
                        )}
                      </span>

                      {/* Lesson title + duration */}
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block leading-snug truncate ${
                            isCompleted ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {lesson.title}
                        </span>
                        {lesson.duration != null && lesson.duration > 0 && (
                          <span className="text-xs text-cc-muted/70 mt-0.5 block">
                            {formatDuration(lesson.duration)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
