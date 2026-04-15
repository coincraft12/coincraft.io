'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

interface PrepareResult { orderId: string; amount: number; examTitle: string; }
interface ExamInfo { id: string; title: string; level: string; description: string | null; examFee: string; timeLimit: number; passingScore: number; }

declare global {
  interface Window {
    PortOne?: { requestPayment: (p: { storeId: string; channelKey: string; paymentId: string; orderName: string; totalAmount: number; currency: string; payMethod: string; customer?: { fullName?: string; email?: string }; redirectUrl?: string; }) => Promise<{ paymentId?: string; code?: string; message?: string }>; };
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function ExamCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const examId = params.examId as string;

  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sdkReady = useRef(false);

  useEffect(() => {
    if (!isLoading && !user) router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!examId) return;
    fetch(`${API_BASE}/api/v1/exams/${examId}`)
      .then((r) => r.ok ? r.json() : Promise.reject('fetch fail'))
      .then((j: { success: boolean; data: ExamInfo }) => setExam(j.data))
      .catch(() => setFetchError('시험 정보를 불러올 수 없습니다.'));
  }, [examId]);

  const handlePayment = async () => {
    if (!token || !exam) return;
    if (!window.PortOne) { setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); return; }

    setError(null);
    setPaying(true);

    try {
      const prepareRes = await apiClient.post<{ success: boolean; data: PrepareResult }>(
        '/api/v1/payments/exams/prepare', { examId: exam.id }, { token }
      );
      const { orderId, amount, examTitle } = prepareRes.data;

      const payResponse = await window.PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId: orderId,
        orderName: examTitle,
        totalAmount: amount,
        currency: 'KRW',
        payMethod: 'CARD',
        customer: {
          fullName: user?.name,
          email: user?.email,
        },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/result`,
      });

      if (payResponse.code) { setError(payResponse.message ?? '결제가 취소되었습니다.'); setPaying(false); return; }
      if (!payResponse.paymentId) { setError('결제 ID를 받지 못했습니다.'); setPaying(false); return; }

      await apiClient.post('/api/v1/payments/exams/confirm', { paymentId: payResponse.paymentId, orderId, amount }, { token });

      router.push(`/exams/${exam.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '결제 처리 중 오류가 발생했습니다.');
      setPaying(false);
    }
  };

  if (isLoading || !user) return <><Header /><main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center"><div className="text-cc-muted">로딩 중...</div></main></>;
  if (fetchError) return <><Header /><main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center"><div className="text-red-400">{fetchError}</div></main></>;
  if (!exam) return <><Header /><main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center"><div className="text-cc-muted">시험 정보를 불러오는 중...</div></main></>;

  return (
    <>
      <Script src="https://cdn.portone.io/v2/browser-sdk.js" onLoad={() => { sdkReady.current = true; }} />
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-cc-text mb-8">검정 응시권 결제</h1>
          <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cc-accent/20 text-cc-accent uppercase">{exam.level}</span>
              </div>
              <h2 className="text-cc-text font-semibold text-lg">{exam.title}</h2>
              {exam.description && <p className="text-cc-muted text-sm mt-1">{exam.description}</p>}
              <div className="flex gap-4 mt-3 text-xs text-cc-muted">
                <span>제한시간 {exam.timeLimit}분</span>
                <span>합격기준 {exam.passingScore}점</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <span className="text-cc-muted">응시료</span>
              <span className="text-xl font-bold text-cc-text">{Number(exam.examFee).toLocaleString()}원</span>
            </div>

            <div className="text-sm text-cc-muted border-t border-white/10 pt-4">
              <div className="flex justify-between"><span>구매자</span><span className="text-cc-text">{user?.name}</span></div>
              <div className="flex justify-between mt-1"><span>이메일</span><span className="text-cc-text">{user?.email}</span></div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded p-3"><p className="text-red-400 text-sm">{error}</p></div>}

            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full" loading={paying} onClick={handlePayment}>
                {Number(exam.examFee).toLocaleString()}원 결제하기
              </Button>
              <Button variant="ghost" size="md" className="w-full" onClick={() => router.back()} disabled={paying}>취소</Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
