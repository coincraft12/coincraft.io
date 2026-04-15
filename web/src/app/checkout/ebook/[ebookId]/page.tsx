'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

interface PrepareResult {
  orderId: string;
  amount: number;
  ebookTitle: string;
}

interface EbookInfo {
  id: string;
  title: string;
  price: string;
  coverImageUrl: string | null;
  description: string | null;
}

declare global {
  interface Window {
    PortOne?: {
      requestPayment: (params: {
        storeId: string;
        channelKey: string;
        paymentId: string;
        orderName: string;
        totalAmount: number;
        currency: string;
        payMethod: string;
      }) => Promise<{ paymentId?: string; code?: string; message?: string }>;
    };
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function EbookCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const ebookId = params.ebookId as string;

  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [ebook, setEbook] = useState<EbookInfo | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sdkReady = useRef(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!ebookId) return;

    async function fetchEbook() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/ebooks/${ebookId}`);
        if (!res.ok) {
          setFetchError('전자책 정보를 불러올 수 없습니다.');
          return;
        }
        const json = await res.json() as { success: boolean; data: EbookInfo };
        setEbook(json.data);
      } catch {
        setFetchError('전자책 정보를 불러오는 중 오류가 발생했습니다.');
      }
    }

    fetchEbook();
  }, [ebookId]);

  const handlePayment = async () => {
    if (!token || !ebook) return;
    if (!window.PortOne) {
      setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setError(null);
    setPaying(true);

    try {
      // Step 1: Prepare payment
      const prepareRes = await apiClient.post<{ success: boolean; data: PrepareResult }>(
        '/api/v1/payments/ebooks/prepare',
        { ebookId: ebook.id },
        { token }
      );
      const { orderId, amount, ebookTitle } = prepareRes.data;

      // Step 2: Open PortOne modal
      const payResponse = await window.PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId: orderId,
        orderName: ebookTitle,
        totalAmount: amount,
        currency: 'KRW',
        payMethod: 'CARD',
      });

      if (payResponse.code) {
        setError(payResponse.message ?? '결제가 취소되었습니다.');
        setPaying(false);
        return;
      }

      if (!payResponse.paymentId) {
        setError('결제 ID를 받지 못했습니다.');
        setPaying(false);
        return;
      }

      // Step 3: Confirm on server
      await apiClient.post<{ success: boolean; data: { ebookId: string } }>(
        '/api/v1/payments/ebooks/confirm',
        { paymentId: payResponse.paymentId, orderId, amount },
        { token }
      );

      // Step 4: Redirect to viewer
      router.push(`/ebooks/${ebook.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('결제 처리 중 오류가 발생했습니다.');
      }
      setPaying(false);
    }
  };

  if (isLoading || !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <div className="text-cc-muted">로딩 중...</div>
        </main>
      </>
    );
  }

  if (fetchError) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <div className="text-red-400">{fetchError}</div>
        </main>
      </>
    );
  }

  if (!ebook) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <div className="text-cc-muted">전자책 정보를 불러오는 중...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Script
        src="https://cdn.portone.io/v2/browser-sdk.js"
        onLoad={() => { sdkReady.current = true; }}
      />
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-cc-text mb-8">전자책 결제</h1>

          <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-6">
            {/* Ebook info */}
            <div className="flex gap-4">
              {ebook.coverImageUrl ? (
                <img
                  src={ebook.coverImageUrl}
                  alt={ebook.title}
                  className="w-16 h-24 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-24 bg-cc-primary rounded flex items-center justify-center">
                  <span className="text-2xl opacity-30">📖</span>
                </div>
              )}
              <div>
                <h2 className="text-cc-text font-semibold">{ebook.title}</h2>
                {ebook.description && (
                  <p className="text-cc-muted text-sm mt-1 line-clamp-2">{ebook.description}</p>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <span className="text-cc-muted">결제 금액</span>
              <span className="text-xl font-bold text-cc-text">
                {Number(ebook.price).toLocaleString()}원
              </span>
            </div>

            {/* Buyer info */}
            <div className="text-sm text-cc-muted border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span>구매자</span>
                <span className="text-cc-text">{user.name}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>이메일</span>
                <span className="text-cc-text">{user.email}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={paying}
                onClick={handlePayment}
              >
                {Number(ebook.price).toLocaleString()}원 결제하기
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="w-full"
                onClick={() => router.back()}
                disabled={paying}
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
