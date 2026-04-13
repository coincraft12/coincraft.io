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
      setAttemptId(res.data.attemptId);
      setQuestions(res.data.questions);
      setTimeLimit(res.data.timeLimit * 60);
      setStarted(true);

      // Request fullscreen
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Fullscreen not supported or denied — continue anyway
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '시험을 시작할 수 없습니다.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, examId]);

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
    setAnswers((prev) => ({ ...prev, [questionId]: index }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;

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
            onClick={() => submitExam(false)}
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
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          <Button
            size="lg"
            className="w-full"
            onClick={() => submitExam(false)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            시험 제출하기 ({answeredCount}/{totalCount} 답변)
          </Button>
        </div>
      </div>
    </div>
  );
}
