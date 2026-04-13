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
  progress: Record<string, boolean>;
}

function calcProgressPercent(chapters: Chapter[], progress: Record<string, boolean>): number {
  const allLessons = chapters.flatMap((ch) => ch.lessons);
  if (allLessons.length === 0) return 0;
  const completed = allLessons.filter((l) => progress[l.id]).length;
  return Math.round((completed / allLessons.length) * 100);
}

export default function LessonSidebar({
  chapters,
  currentLessonId,
  courseSlug,
  progress,
}: LessonSidebarProps) {
  const percent = calcProgressPercent(chapters, progress);

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex justify-between text-xs text-cc-muted mb-1.5">
          <span>진도</span>
          <span>{percent}%</span>
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
            <p className="px-4 py-2 text-xs font-semibold text-cc-muted uppercase tracking-wide">
              {chapter.title}
            </p>
            <ul>
              {chapter.lessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                const isCompleted = progress[lesson.id] === true;

                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/courses/${courseSlug}/lessons/${lesson.id}`}
                      className={`flex items-start gap-2 px-4 py-2.5 text-sm transition-colors ${
                        isCurrent
                          ? 'bg-cc-accent/10 border-r-2 border-cc-accent text-cc-accent'
                          : 'text-cc-muted hover:bg-white/5 hover:text-cc-text'
                      }`}
                    >
                      <span className="mt-0.5 flex-shrink-0">
                        {isCompleted ? '✅' : lesson.type === 'video' ? '🎥' : '📄'}
                      </span>
                      <span className={`flex-1 leading-snug ${isCompleted ? 'line-through opacity-60' : ''}`}>
                        {lesson.title}
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
