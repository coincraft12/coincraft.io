'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

interface FeedbackItem {
  questionId: string;
  question: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string | null;
}

interface AttemptResult {
  score: number;
  isPassed: boolean;
  passingScore: number;
  feedback: FeedbackItem[];
  certificate: { id: string; certNumber: string; level: string } | null;
}

interface ResultResponse {
  success: boolean;
  data: AttemptResult;
}

export default function ExamResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.id as string;
  const attemptId = searchParams.get('attemptId');
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isGrading, setIsGrading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!token || !attemptId) return;

    async function fetchResult() {
      try {
        const stored = sessionStorage.getItem(`exam-result-${attemptId}`);
        if (stored) {
          setResult(JSON.parse(stored) as AttemptResult);
          setIsLoading(false);
          return;
        }
        // fallback: API 조회 (새로고침 등 sessionStorage 소실 시)
        const res = await apiClient.get<{ success: boolean; data: AttemptResult }>(
          `/api/v1/exams/attempts/${attemptId}/result`,
          { token: token ?? undefined }
        );
        setResult(res.data);
      } catch {
        setError('결과를 불러올 수 없습니다. 시험 목록으로 돌아가 주세요.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchResult();
  }, [isAuthLoading, token, attemptId, router]);

  // 채점 프로그레스 애니메이션 (결과 로드 완료 후 시작)
  useEffect(() => {
    if (isLoading || error) return;

    const STAGES = [
      { target: 28, duration: 600 },
      { target: 55, duration: 700 },
      { target: 79, duration: 600 },
      { target: 95, duration: 500 },
      { target: 100, duration: 400 },
    ];

    let current = 0;
    let stageIdx = 0;

    const tick = () => {
      if (stageIdx >= STAGES.length) return;
      const { target, duration } = STAGES[stageIdx];
      const steps = Math.ceil(duration / 30);
      const increment = (target - current) / steps;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current = Math.min(current + increment, target);
        setProgress(Math.round(current));
        if (step >= steps) {
          clearInterval(interval);
          stageIdx++;
          if (stageIdx < STAGES.length) {
            setTimeout(tick, 150);
          } else {
            setTimeout(() => setIsGrading(false), 300);
          }
        }
      }, 30);
    };

    tick();
  }, [isLoading, error]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isGrading && !error) {
    const stages = ['답변 수집 중', '정답 대조 중', '점수 계산 중', '결과 생성 중'];
    const stageIndex = progress < 30 ? 0 : progress < 60 ? 1 : progress < 85 ? 2 : 3;
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="space-y-2">
            <p className="text-cc-label text-xs tracking-widest">GRADING</p>
            <h2 className="text-xl font-bold text-cc-text">채점 중입니다</h2>
            <p className="text-cc-muted text-sm">{stages[stageIndex]}...</p>
          </div>
          <div className="space-y-3">
            <div className="w-full h-2 bg-cc-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-cc-accent rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-cc-accent font-bold text-sm tabular-nums">{progress}%</p>
          </div>
          <p className="text-xs text-cc-muted">잠시만 기다려 주세요</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 pb-16 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-cc-muted">{error ?? '결과를 불러올 수 없습니다.'}</p>
            <Button onClick={() => router.push('/exams')}>시험 목록으로</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const correctCount = result.feedback.filter((f) => f.isCorrect).length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl">
          {/* Result header */}
          <div
            className={`rounded-cc p-8 text-center mb-8 ${
              result.isPassed
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <div className="text-5xl mb-4">{result.isPassed ? '🎉' : '📚'}</div>
            <h1 className="text-2xl font-bold text-cc-text mb-2">
              {result.isPassed ? '합격을 축하합니다!' : '아쉽게도 불합격입니다.'}
            </h1>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div>
                <p className="text-cc-muted text-sm">내 점수</p>
                <p className={`text-4xl font-bold ${result.isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.score}점
                </p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <p className="text-cc-muted text-sm">합격 기준</p>
                <p className="text-4xl font-bold text-cc-muted">{result.passingScore}점</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <p className="text-cc-muted text-sm">정답</p>
                <p className="text-4xl font-bold text-cc-text">
                  {correctCount}/{result.feedback.length}
                </p>
              </div>
            </div>
          </div>

          {/* Certificate info */}
          {result.isPassed && result.certificate && (
            <div className="bg-cc-secondary border border-cc-accent/30 rounded-cc p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-cc-text font-semibold">자격증이 발급되었습니다</p>
                <p className="text-cc-muted text-sm font-mono">{result.certificate.certNumber}</p>
              </div>
              <Link href="/my/certificates">
                <Button variant="outline" size="sm">내 자격증 보기</Button>
              </Link>
            </div>
          )}

          {/* Feedback */}
          <h2 className="text-cc-text font-semibold text-lg mb-4">문제 해설</h2>
          <div className="space-y-4 mb-8">
            {result.feedback.map((item, idx) => (
              <div
                key={item.questionId}
                className={`bg-cc-secondary border rounded-cc p-5 ${
                  item.isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      item.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {item.isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="text-cc-text text-sm font-medium">{idx + 1}. {item.question}</p>
                </div>
                <div className="pl-9 space-y-1.5">
                  {item.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`text-xs px-3 py-1.5 rounded ${
                        optIdx === item.correctIndex
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : optIdx === item.selectedIndex && !item.isCorrect
                          ? 'bg-red-500/20 text-red-300'
                          : 'text-cc-muted'
                      }`}
                    >
                      <span className="font-semibold mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                      {opt}
                      {optIdx === item.correctIndex && (
                        <span className="ml-2 font-semibold text-emerald-400">정답</span>
                      )}
                      {optIdx === item.selectedIndex && !item.isCorrect && (
                        <span className="ml-2 font-semibold text-red-400">내 답변</span>
                      )}
                    </div>
                  ))}
                  {item.explanation && (
                    <p className="text-xs text-cc-muted mt-2 pt-2 border-t border-white/10">
                      해설: {item.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/exams')} className="flex-1">
              시험 목록
            </Button>
            {result.isPassed ? (
              <Button onClick={() => router.push('/my/certificates')} className="flex-1">
                내 자격증 보기
              </Button>
            ) : (
              <Button onClick={() => router.push(`/exams/${examId}`)} className="flex-1">
                다시 응시하기
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
