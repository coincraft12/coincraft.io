'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import Spinner from '@/components/ui/Spinner';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  order: number;
}

interface QuizResponse {
  quizStatus: string;
  questions: QuizQuestion[];
}

interface QuizSectionProps {
  lessonId: string;
}

type AnswerState = 'unanswered' | 'correct' | 'wrong';

export function QuizSection({ lessonId }: QuizSectionProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['quiz', lessonId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: QuizResponse }>(
        `/api/v1/lessons/${lessonId}/quiz`,
        { token: token ?? undefined }
      );
      return res.data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!data || data.quizStatus === 'none' || data.questions.length === 0) {
    return (
      <p className="text-cc-muted text-sm text-center py-8">
        아직 퀴즈가 준비되지 않았습니다.
      </p>
    );
  }

  if (data.quizStatus === 'generating') {
    return (
      <p className="text-cc-muted text-sm text-center py-8">
        퀴즈를 생성하는 중입니다...
      </p>
    );
  }

  const questions = data.questions;
  const totalSubmitted = Object.keys(submitted).length;
  const totalCorrect = questions.filter(
    (q) => submitted[q.id] && answers[q.id] === q.correctIndex
  ).length;
  const allDone = totalSubmitted === questions.length;

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (submitted[questionId]) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = (questionId: string) => {
    if (answers[questionId] === undefined) return;
    setSubmitted((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted({});
    setCurrentIndex(0);
  };

  const getAnswerState = (q: QuizQuestion, optionIndex: number): AnswerState => {
    if (!submitted[q.id]) return 'unanswered';
    if (optionIndex === q.correctIndex) return 'correct';
    if (optionIndex === answers[q.id]) return 'wrong';
    return 'unanswered';
  };

  const QuestionCard = ({ q, index }: { q: QuizQuestion; index: number }) => {
    const isSubmitted = !!submitted[q.id];
    const selectedIndex = answers[q.id];
    const isCorrect = isSubmitted && selectedIndex === q.correctIndex;

    return (
      <div className="cc-glass p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-cc-accent bg-cc-accent/10 px-2 py-1 rounded shrink-0">
            Q{index + 1}
          </span>
          <p className="text-cc-text font-medium leading-snug">{q.question}</p>
        </div>

        <div className="space-y-2">
          {q.options.map((option, i) => {
            const state = getAnswerState(q, i);
            return (
              <button
                key={i}
                onClick={() => handleSelect(q.id, i)}
                disabled={isSubmitted}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                  !isSubmitted && selectedIndex === i
                    ? 'border-cc-accent bg-cc-accent/10 text-cc-accent'
                    : !isSubmitted
                    ? 'border-white/10 bg-white/5 text-cc-muted hover:border-white/30 hover:text-cc-text'
                    : state === 'correct'
                    ? 'border-green-500/50 bg-green-500/10 text-green-300'
                    : state === 'wrong'
                    ? 'border-red-500/50 bg-red-500/10 text-red-300 line-through'
                    : 'border-white/10 bg-white/5 text-cc-muted opacity-50'
                }`}
              >
                <span className="font-medium mr-2 text-xs">{['①', '②', '③', '④'][i]}</span>
                {option}
                {state === 'correct' && ' ✓'}
              </button>
            );
          })}
        </div>

        {!isSubmitted ? (
          <div className="flex justify-end">
            <button
              onClick={() => handleSubmit(q.id)}
              disabled={selectedIndex === undefined}
              className="px-4 py-2 text-sm rounded bg-cc-accent text-black font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cc-accent/90 transition"
            >
              제출
            </button>
          </div>
        ) : (
          <div className={`p-3 rounded-lg text-sm border ${
            isCorrect
              ? 'bg-green-500/10 border-green-500/20 text-green-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            <p className="font-semibold mb-1">{isCorrect ? '✓ 정답입니다!' : '✗ 오답입니다.'}</p>
            {q.explanation && <p className="text-xs opacity-80">{q.explanation}</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 헤더: 진행 상황 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-cc-muted">{questions.length}문제</span>
          {totalSubmitted > 0 && (
            <span className="text-xs text-cc-muted">
              {totalSubmitted}/{questions.length} 제출 · 정답 {totalCorrect}개
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-cc-muted hover:text-cc-text transition"
          >
            {showAll ? '한 문제씩 보기' : '전체 보기'}
          </button>
          {totalSubmitted > 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-cc-muted hover:text-red-400 transition ml-2"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 퀴즈 본문 */}
      {showAll ? (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <QuestionCard q={questions[currentIndex]} index={currentIndex} />

          {/* 이전/다음 네비게이션 */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-sm text-cc-muted border border-white/10 rounded hover:border-white/30 disabled:opacity-30 transition"
            >
              ← 이전
            </button>
            <span className="text-xs text-cc-muted">
              {currentIndex + 1} / {questions.length}
            </span>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 text-sm text-cc-muted border border-white/10 rounded hover:border-white/30 disabled:opacity-30 transition"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* 최종 점수 */}
      {allDone && (
        <div className={`p-6 rounded-xl border text-center space-y-2 ${
          totalCorrect === questions.length
            ? 'bg-green-500/10 border-green-500/30'
            : totalCorrect >= questions.length * 0.6
            ? 'bg-cc-accent/10 border-cc-accent/30'
            : 'bg-white/5 border-white/10'
        }`}>
          <p className="text-2xl font-bold text-cc-text">
            {totalCorrect} / {questions.length}
          </p>
          <p className="text-sm text-cc-muted">
            {totalCorrect === questions.length
              ? '🎉 완벽합니다! 강의 내용을 완전히 이해했습니다.'
              : totalCorrect >= questions.length * 0.6
              ? '👍 잘 하셨습니다! 틀린 문제를 한번 더 확인해보세요.'
              : '💪 강의 내용을 다시 한번 복습해 보세요.'}
          </p>
        </div>
      )}
    </div>
  );
}
