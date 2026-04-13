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

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!token || !attemptId) return;

    // Fetch attempt result by re-submitting or getting from state
    // Since we already submitted, we fetch the attempt status
    async function fetchResult() {
      try {
        // We store the result in sessionStorage from the attempt page
        const stored = sessionStorage.getItem(`exam-result-${attemptId}`);
        if (stored) {
          setResult(JSON.parse(stored) as AttemptResult);
          setIsLoading(false);
          return;
        }
        // Fallback: show error since result should have been stored
        setError('결과를 불러올 수 없습니다. 시험 목록으로 돌아가 주세요.');
      } catch {
        setError('결과를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchResult();
  }, [isAuthLoading, token, attemptId, router]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
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
