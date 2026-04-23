'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  isPreview: boolean;
  order: number;
}

interface ChapterWithLessons {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CurriculumAccordionProps {
  chapters: ChapterWithLessons[];
  courseSlug: string;
  progress?: Record<string, boolean>;
  isEnrolled: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function LessonTypeIcon({ type }: { type: string }) {
  return <span className="text-sm">{type === 'video' ? '🎥' : '📄'}</span>;
}

export default function CurriculumAccordion({
  chapters,
  courseSlug,
  progress = {},
  isEnrolled,
}: CurriculumAccordionProps) {
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set([chapters[0]?.id ?? '']));

  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {chapters.map((chapter) => {
        const isOpen = openChapters.has(chapter.id);
        return (
          <div key={chapter.id} className="border border-white/10 rounded-cc overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => toggleChapter(chapter.id)}
            >
              <span className="font-semibold text-cc-text text-sm">{chapter.title}</span>
              <span className="text-cc-muted text-xs ml-2">
                {isOpen ? '▲' : '▾'}
              </span>
            </button>

            {isOpen && (
              <ul className="divide-y divide-white/5">
                {chapter.lessons.map((lesson) => {
                  const isCompleted = progress[lesson.id] === true;
                  const canAccess = isEnrolled || lesson.isPreview;

                  const lessonContent = (
                    <div className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">
                      <LessonTypeIcon type={lesson.type} />
                      <span className={`flex-1 ${isCompleted ? 'text-cc-muted line-through' : 'text-cc-text'}`}>
                        {lesson.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-cc-muted">
                        {lesson.duration && <span>{formatDuration(lesson.duration)}</span>}
                        {isCompleted ? (
                          <span title="완료">✅</span>
                        ) : canAccess ? (
                          <span title={lesson.isPreview ? '미리보기 가능' : '수강 가능'}>🔓</span>
                        ) : (
                          <span title="잠김">🔒</span>
                        )}
                      </div>
                    </div>
                  );

                  return (
                    <li key={lesson.id}>
                      {canAccess ? (
                        <Link href={`/courses/${courseSlug}/lessons/${lesson.id}`} className="block">
                          {lessonContent}
                        </Link>
                      ) : (
                        <div className="cursor-not-allowed opacity-60">{lessonContent}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
