'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';
import Spinner from '@/components/ui/Spinner';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentHistoryItem {
  id: string;
  productType: string;
  productId: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  paidAt: string | null;
  createdAt: string;
}

interface PaymentHistoryResponse {
  success: boolean;
  data: PaymentHistoryItem[];
}

interface RefundResponse {
  success: boolean;
  data: { refunded: boolean };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  course: '강좌',
  ebook: '전자책',
  exam: '검정',
  subscription: '구독',
};

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  paid: { text: '결제완료', className: 'text-green-400' },
  refunded: { text: '환불완료', className: 'text-cc-muted' },
  pending: { text: '결제대기', className: 'text-yellow-400' },
};

function formatKRW(amount: string): string {
  return parseInt(amount, 10).toLocaleString('ko-KR') + '원';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function isRefundable(item: PaymentHistoryItem): boolean {
  if (item.status !== 'paid') return false;
  const paidAt = item.paidAt ? new Date(item.paidAt) : new Date(item.createdAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return paidAt >= sevenDaysAgo;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyPaymentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const queryClient = useQueryClient();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoading, token, router, pathname]);

  const { data, isLoading } = useQuery<PaymentHistoryItem[]>({
    queryKey: ['payment-history'],
    queryFn: async () => {
      const res = await apiClient.get<PaymentHistoryResponse>('/api/v1/payments/history', {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token,
  });

  const refundMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return apiClient.post<RefundResponse>(
        `/api/v1/payments/${paymentId}/refund`,
        {},
        { token: token ?? undefined }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      setConfirmId(null);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : '환불 처리 중 오류가 발생했습니다.';
      setErrorMsg(msg);
      setConfirmId(null);
    },
  });

  if (isAuthLoading || !token) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-10">
            <p className="cc-label mb-2">MY ACCOUNT</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">결제 내역</h1>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-cc text-red-400 text-sm flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="ml-4 text-red-400 hover:text-red-300">
                ✕
              </button>
            </div>
          )}

          {/* 환불 확인 모달 */}
          {confirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-cc-secondary border border-white/10 rounded-cc p-8 max-w-sm w-full mx-4 space-y-5">
                <h2 className="text-cc-text font-bold text-lg">환불 요청</h2>
                <p className="text-cc-muted text-sm leading-relaxed">
                  정말로 환불을 요청하시겠습니까?<br />
                  환불 후에는 해당 상품에 대한 접근 권한이 즉시 삭제됩니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmId(null)}
                    className="flex-1 py-2.5 rounded-cc border border-white/20 text-cc-muted text-sm hover:border-white/40 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => { setErrorMsg(null); refundMutation.mutate(confirmId); }}
                    disabled={refundMutation.isPending}
                    className="flex-1 py-2.5 rounded-cc bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {refundMutation.isPending ? '처리 중...' : '환불 확인'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <p className="text-5xl">💳</p>
              <p className="text-cc-muted">결제 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-cc-muted font-medium">유형</th>
                    <th className="text-left py-3 px-4 text-cc-muted font-medium">금액</th>
                    <th className="text-left py-3 px-4 text-cc-muted font-medium">결제일</th>
                    <th className="text-left py-3 px-4 text-cc-muted font-medium">상태</th>
                    <th className="text-left py-3 px-4 text-cc-muted font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => {
                    const statusInfo = STATUS_LABEL[item.status] ?? { text: item.status, className: 'text-cc-muted' };
                    const canRefund = isRefundable(item);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-4 text-cc-text">
                          <span className="inline-block bg-white/5 rounded px-2 py-0.5 text-xs text-cc-muted mr-2">
                            {PRODUCT_TYPE_LABEL[item.productType] ?? item.productType}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-cc-text font-semibold">
                          {formatKRW(item.amount)}
                        </td>
                        <td className="py-4 px-4 text-cc-muted">
                          {formatDate(item.paidAt ?? item.createdAt)}
                        </td>
                        <td className={`py-4 px-4 font-medium ${statusInfo.className}`}>
                          {statusInfo.text}
                        </td>
                        <td className="py-4 px-4">
                          {canRefund && (
                            <button
                              onClick={() => {
                                setErrorMsg(null);
                                setConfirmId(item.id);
                              }}
                              className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded px-2.5 py-1 transition-colors"
                            >
                              환불 요청
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
