'use client';

import { useEffect, useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  productType: string;
  productId: string;
  amount: string;
  status: string;
  provider: string;
  createdAt: string;
  paidAt: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: '대기중', color: 'text-yellow-400' },
  paid:     { label: '완료', color: 'text-green-400' },
  refunded: { label: '환불', color: 'text-red-400' },
  failed:   { label: '실패', color: 'text-red-400' },
};

const PROVIDER_LABELS: Record<string, string> = {
  portone:      'PortOne',
  bank_transfer: '무통장 입금',
};

const PRODUCT_LABELS: Record<string, string> = {
  course:       '강좌',
  ebook:        '전자책',
  exam:         '검정',
  subscription: '구독',
};

export default function AdminPaymentsPage() {
  const { user, accessToken } = useAuthStore();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');

  const fetchPayments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiClient.get<{ success: boolean; data: Payment[] }>(
        '/api/v1/admin/payments',
        { token: accessToken }
      );
      setPayments(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleApprove = async (paymentId: string) => {
    if (!accessToken) return;
    setApproving(paymentId);
    try {
      await apiClient.post(
        `/api/v1/admin/payments/${paymentId}/approve`,
        {},
        { token: accessToken }
      );
      await fetchPayments();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '승인 처리 중 오류가 발생했습니다.');
    } finally {
      setApproving(null);
    }
  };

  const filtered = payments.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterProvider !== 'all' && p.provider !== filterProvider) return false;
    return true;
  });

  if (!user) return null;

  return (
    <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-cc-text">결제 관리</h1>
            <button
              onClick={fetchPayments}
              className="text-sm text-cc-muted hover:text-cc-text transition-colors"
            >
              새로고침
            </button>
          </div>

          {/* 필터 */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-cc-secondary border border-white/10 text-cc-text text-sm rounded px-3 py-1.5"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기중</option>
              <option value="paid">완료</option>
              <option value="refunded">환불</option>
            </select>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="bg-cc-secondary border border-white/10 text-cc-text text-sm rounded px-3 py-1.5"
            >
              <option value="all">전체 결제수단</option>
              <option value="portone">PortOne</option>
              <option value="bank_transfer">무통장 입금</option>
            </select>
            <span className="text-sm text-cc-muted self-center">
              {filtered.length}건
              {filterProvider === 'bank_transfer' && filterStatus === 'pending' && (
                <span className="ml-2 text-yellow-400 font-semibold">승인 대기 {filtered.length}건</span>
              )}
            </span>
          </div>

          {loading ? (
            <div className="text-cc-muted text-center py-20">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="text-cc-muted text-center py-20">결제 내역이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-cc-muted text-left">
                    <th className="pb-3 pr-4">사용자</th>
                    <th className="pb-3 pr-4">상품</th>
                    <th className="pb-3 pr-4">금액</th>
                    <th className="pb-3 pr-4">결제수단</th>
                    <th className="pb-3 pr-4">상태</th>
                    <th className="pb-3 pr-4">신청일</th>
                    <th className="pb-3">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const statusInfo = STATUS_LABELS[p.status] ?? { label: p.status, color: 'text-cc-muted' };
                    const date = new Date(p.createdAt);
                    const dateStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
                    return (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="text-cc-text font-medium">{p.userName}</div>
                          <div className="text-cc-muted text-xs">{p.userEmail}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs bg-white/10 rounded px-1.5 py-0.5 text-cc-muted">
                            {PRODUCT_LABELS[p.productType] ?? p.productType}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-cc-text font-semibold">
                          {Number(p.amount).toLocaleString()}원
                        </td>
                        <td className="py-3 pr-4 text-cc-muted">
                          {PROVIDER_LABELS[p.provider] ?? p.provider}
                        </td>
                        <td className={`py-3 pr-4 font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </td>
                        <td className="py-3 pr-4 text-cc-muted">{dateStr}</td>
                        <td className="py-3">
                          {p.provider === 'bank_transfer' && p.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={approving === p.id}
                              onClick={() => handleApprove(p.id)}
                            >
                              승인
                            </Button>
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
  );
}
