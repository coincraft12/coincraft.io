'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

interface PrepareResult { orderId: string; amount: number; planLabel: string; plan: string; }

const PLAN_INFO: Record<string, { label: string; amount: number; period: string; benefits: string[] }> = {
  'basic-monthly': {
    label: 'Basic 월간 구독',
    amount: 29000,
    period: '1개월',
    benefits: ['모든 강좌 무제한 수강', '전자책 무제한 열람', '검정 응시 1회 포함', '월간 뉴스레터 구독'],
  },
  'basic-yearly': {
    label: 'Basic 연간 구독',
    amount: 290000,
    period: '12개월',
    benefits: ['모든 강좌 무제한 수강', '전자책 무제한 열람', '검정 응시 2회 포함', '월간 뉴스레터 구독', '2개월 무료 혜택'],
  },
};

declare global {
  interface Window {
    PortOne?: { requestPayment: (p: { storeId: string; channelKey: string; paymentId: string; orderName: string; totalAmount: number; currency: string; payMethod: string; }) => Promise<{ paymentId?: string; code?: string; message?: string }>; };
  }
}

export default function SubscriptionCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const plan = params.plan as string;

  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sdkReady = useRef(false);

  const planInfo = PLAN_INFO[plan];

  useEffect(() => {
    if (!isLoading && !user) router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [isLoading, user, router]);

  const handlePayment = async () => {
    if (!token || !planInfo) return;
    if (!window.PortOne) { setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); return; }

    setError(null);
    setPaying(true);

    try {
      const prepareRes = await apiClient.post<{ success: boolean; data: PrepareResult }>(
        '/api/v1/payments/subscriptions/prepare', { plan }, { token }
      );
      const { orderId, amount, planLabel } = prepareRes.data;

      const payResponse = await window.PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId: orderId,
        orderName: planLabel,
        totalAmount: amount,
        currency: 'KRW',
        payMethod: 'CARD',
      });

      if (payResponse.code) { setError(payResponse.message ?? '결제가 취소되었습니다.'); setPaying(false); return; }
      if (!payResponse.paymentId) { setError('결제 ID를 받지 못했습니다.'); setPaying(false); return; }

      await apiClient.post('/api/v1/payments/subscriptions/confirm', { paymentId: payResponse.paymentId, orderId, amount }, { token });

      router.push('/my');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '결제 처리 중 오류가 발생했습니다.');
      setPaying(false);
    }
  };

  if (isLoading || !user) return <><Header /><main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center"><div className="text-cc-muted">로딩 중...</div></main></>;
  if (!planInfo) return <><Header /><main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center"><div className="text-red-400">존재하지 않는 플랜입니다.</div></main></>;

  return (
    <>
      <Script src="https://cdn.portone.io/v2/browser-sdk.js" onLoad={() => { sdkReady.current = true; }} />
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-cc-text mb-8">구독 결제</h1>
          <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-6">

            <div>
              <h2 className="text-cc-text font-semibold text-lg">{planInfo.label}</h2>
              <p className="text-cc-muted text-sm mt-1">구독 기간: {planInfo.period}</p>
              <ul className="mt-3 space-y-1.5">
                {planInfo.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-cc-muted">
                    <span className="text-cc-accent">✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <span className="text-cc-muted">결제 금액</span>
              <span className="text-xl font-bold text-cc-text">{planInfo.amount.toLocaleString()}원 / {planInfo.period}</span>
            </div>

            <div className="text-sm text-cc-muted border-t border-white/10 pt-4">
              <div className="flex justify-between"><span>구매자</span><span className="text-cc-text">{user.name}</span></div>
              <div className="flex justify-between mt-1"><span>이메일</span><span className="text-cc-text">{user.email}</span></div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded p-3"><p className="text-red-400 text-sm">{error}</p></div>}

            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full" loading={paying} onClick={handlePayment}>
                {planInfo.amount.toLocaleString()}원 결제하기
              </Button>
              <Button variant="ghost" size="md" className="w-full" onClick={() => router.back()} disabled={paying}>취소</Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
