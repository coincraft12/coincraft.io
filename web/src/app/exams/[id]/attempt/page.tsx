'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import ExamQuestion from '@/components/exam/exam-question';
import ExamTimer from '@/components/exam/exam-timer';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface Question {
  id: string;
  question: string;
  options: string[];
  order: number;
  points: number;
}

interface StartExamResponse {
  success: boolean;
  data: {
    attemptId: string;
    startedAt: string;
    timeLimit: number;
    questions: Question[];
    resumed: boolean;
  };
}

interface SubmitExamResponse {
  success: boolean;
  data: {
    score: number;
    isPassed: boolean;
    passingScore: number;
    certificate: { certNumber: string } | null;
  };
}

const TAB_SWITCH_LIMIT = 3;

export default function ExamAttemptPage() {
  const params = useParams();
  const examId = params.id as string;
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const [started, setStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLimit, setTimeLimit] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const tabSwitchCount = useRef(0);
  const submitted = useRef(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=/exams/${examId}/attempt`);
    }
  }, [isAuthLoading, token, router, examId]);

  // Start exam
  const startExam = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<StartExamResponse>(
        `/api/v1/exams/${examId}/start`,
        {},
        { token }
      );
      const { attemptId: newAttemptId, startedAt, timeLimit: tl, questions: qs, resumed } = res.data;
      setAttemptId(newAttemptId);
      setQuestions(qs);

      // 남은 시간 계산 (재접속 시 이미 경과한 시간 차감)
      const elapsedSec = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const remainingSec = Math.max(tl * 60 - elapsedSec, 0);
      setTimeLimit(remainingSec);

      // 이어받기인 경우 localStorage에서 답변 복원
      if (resumed) {
        try {
          const saved = localStorage.getItem(`exam-answers-${newAttemptId}`);
          if (saved) setAnswers(JSON.parse(saved));
        } catch { /* ignore */ }
      }

      setStarted(true);

      // Request fullscreen
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Fullscreen not supported or denied — continue anyway
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '시험을 시작할 수 없습니다.';
      if (msg.includes('이미 제출')) {
        router.replace(`/exams/${examId}`);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, examId, router]);

  // Submit exam
  const submitExam = useCallback(async (_auto = false) => {
    if (!token || !attemptId || submitted.current) return;
    submitted.current = true;
    setIsSubmitting(true);
    try {
      // Exit fullscreen
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch { /* ignore */ }
      }

      const res = await apiClient.post<SubmitExamResponse>(
        `/api/v1/exams/attempts/${attemptId}/submit`,
        { answers },
        { token }
      );
      // Store result for result page
      try {
        sessionStorage.setItem(`exam-result-${attemptId}`, JSON.stringify(res.data));
        localStorage.removeItem(`exam-answers-${attemptId}`);
      } catch { /* ignore */ }
      router.push(`/exams/${examId}/result?attemptId=${attemptId}`);
    } catch (err: unknown) {
      submitted.current = false;
      const msg = err instanceof Error ? err.message : '제출 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, attemptId, answers, router, examId]);

  // Tab visibility change detection
  useEffect(() => {
    if (!started) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        if (tabSwitchCount.current >= TAB_SWITCH_LIMIT) {
          submitExam(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started, submitExam]);

  const handleSelect = (questionId: string, index: number) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: index };
      if (attemptId) {
        try { localStorage.setItem(`exam-answers-${attemptId}`, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const allAnswered = answeredCount === totalCount && totalCount > 0;

  const handleSubmitClick = () => {
    if (!allAnswered) {
      setShowUnanswered(true);
      return;
    }
    setShowConfirm(true);
  };

  if (isAuthLoading || !token) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-4">
          <h2 className="text-xl font-bold text-cc-text">시험 준비</h2>
          <p className="text-cc-muted text-sm">
            시작 버튼을 누르면 시험이 즉시 시작됩니다. 전체화면 모드로 전환됩니다.
          </p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={startExam} loading={isLoading} size="lg" className="w-full">
            시험 시작
          </Button>
          <button
            onClick={() => router.back()}
            className="text-sm text-cc-muted hover:text-cc-text transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cc-primary select-none"
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-cc-primary/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm text-cc-muted">
            <span className="text-cc-text font-semibold">{answeredCount}</span>
            <span> / {totalCount} 답변 완료</span>
          </div>
          <ExamTimer initialSeconds={timeLimit} onTimeUp={() => submitExam(true)} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmitClick}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            최종 제출
          </Button>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {questions.map((q, idx) => (
          <ExamQuestion
            key={q.id}
            questionNumber={idx + 1}
            question={q.question}
            options={q.options}
            selectedIndex={answers[q.id] ?? null}
            onSelect={(index) => handleSelect(q.id, index)}
          />
        ))}

        {/* Submit button at bottom */}
        <div className="pt-6 pb-4">
          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmitClick}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            시험 제출하기 ({answeredCount}/{totalCount} 답변)
          </Button>
        </div>
      </div>

      {/* 미답변 경고 모달 */}
      {showUnanswered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-cc-secondary border border-red-500/30 rounded-2xl p-8 max-w-sm w-full space-y-5 text-center shadow-xl">
            <p className="text-3xl">⛔</p>
            <h3 className="text-lg font-bold text-cc-text">미답변 문항이 있습니다</h3>
            <p className="text-sm text-cc-muted leading-relaxed">
              <span className="text-red-400 font-bold text-base">{totalCount - answeredCount}개</span> 문항에 아직 답변하지 않았습니다.<br />
              모든 문항에 답변한 후 제출할 수 있습니다.
            </p>
            <button
              onClick={() => setShowUnanswered(false)}
              className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-bold hover:bg-red-500/30 transition-colors"
            >
              계속 풀기
            </button>
          </div>
        </div>
      )}

      {/* 제출 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-cc-secondary border border-white/10 rounded-2xl p-8 max-w-sm w-full space-y-6 text-center shadow-xl">
            <p className="text-3xl">📋</p>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-cc-text">최종 제출하시겠습니까?</h3>
              <p className="text-sm text-cc-muted leading-relaxed">
                전체 {totalCount}문항 모두 답변 완료.<br />
                제출 후에는 수정 및 재응시가 불가합니다.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowConfirm(false); submitExam(false); }}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-cc-accent text-[#0f172a] text-base font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                제출하기
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-3 rounded-xl border border-white/10 text-cc-muted text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                취소 — 계속 검토하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
