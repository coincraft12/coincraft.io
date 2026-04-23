'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';

import { apiClient, ApiError } from '@/lib/api-client';

interface BookOrder {
  id: string;
  bookTitle: string;
  userName: string;
  userEmail: string;
  quantity: number;
  totalAmount: number;
  status: string;
  shippingName: string;
  shippingPhone: string;
  postalCode: string;
  shippingAddress: string;
  shippingDetail: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '처리중' },
  { value: 'paid', label: '결제완료' },
  { value: 'preparing', label: '발송준비' },
  { value: 'shipped', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '취소' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400',
  paid: 'text-cc-accent',
  preparing: 'text-blue-300',
  shipped: 'text-blue-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
};

export default function AdminBookOrdersPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [orders, setOrders] = useState<BookOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: BookOrder[] }>(
        '/api/v1/admin/book-orders',
        { token }
      );
      setOrders(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '주문 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'admin') fetchOrders();
  }, [token, user, fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    if (!token) return;
    setUpdating(orderId);
    try {
      await apiClient.patch(
        `/api/v1/admin/book-orders/${orderId}/status`,
        { status },
        { token }
      );
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '상태 변경에 실패했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  const shipOrder = async (orderId: string) => {
    const trackingNumber = trackingInputs[orderId]?.trim();
    if (!trackingNumber) {
      alert('운송장 번호를 입력해주세요.');
      return;
    }
    if (!token) return;
    setActionLoading((prev) => ({ ...prev, [orderId]: 'ship' }));
    try {
      await apiClient.post(
        `/api/v1/admin/book-orders/${orderId}/ship`,
        { trackingNumber },
        { token }
      );
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'shipped' } : o));
      alert('배송 출발 처리 완료. 알림톡이 발송되었습니다.');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '배송 출발 처리에 실패했습니다.');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
    }
  };

  const deliverOrder = async (orderId: string) => {
    if (!token) return;
    if (!confirm('배송 완료로 처리하시겠습니까? 알림톡이 발송됩니다.')) return;
    setActionLoading((prev) => ({ ...prev, [orderId]: 'deliver' }));
    try {
      await apiClient.post(
        `/api/v1/admin/book-orders/${orderId}/deliver`,
        {},
        { token }
      );
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'delivered' } : o));
      alert('배송 완료 처리 완료. 알림톡이 발송되었습니다.');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '배송 완료 처리에 실패했습니다.');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
    }
  };

  const resendNotification = async (orderId: string) => {
    if (!token) return;
    setActionLoading((prev) => ({ ...prev, [orderId]: 'resend' }));
    try {
      await apiClient.post(
        `/api/v1/admin/book-orders/${orderId}/resend`,
        {},
        { token }
      );
      alert('주문확인 알림톡이 재발송되었습니다.');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '알림톡 재발송에 실패했습니다.');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
    }
  };

  if (!user) return null;

  return (
    <div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="cc-label mb-1">ADMIN</p>
              <h1 className="text-2xl font-bold text-cc-text">종이책 주문 관리</h1>
            </div>
            <button onClick={fetchOrders} className="text-sm text-cc-muted hover:text-cc-text border border-white/20 px-3 py-1.5 rounded transition-colors">
              새로고침
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-cc p-4 mb-6 text-red-400 text-sm">{error}</div>
          )}

          {loading ? (
            <div className="text-cc-muted text-center py-20">불러오는 중...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-cc-muted">주문 내역이 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isActing = (key: string) => actionLoading[order.id] === key;
                return (
                  <div key={order.id} className="bg-cc-secondary border border-white/10 rounded-cc p-5 space-y-4">
                    {/* 주문 정보 */}
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-cc-text font-semibold">{order.bookTitle}</span>
                          <span className="text-xs text-cc-muted">x{order.quantity}</span>
                          <span className="text-cc-accent font-semibold">{order.totalAmount.toLocaleString('ko-KR')}원</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            order.status === 'delivered' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                            order.status === 'shipped' ? 'border-blue-400/30 bg-blue-400/10 text-blue-400' :
                            order.status === 'preparing' ? 'border-blue-300/30 bg-blue-300/10 text-blue-300' :
                            order.status === 'paid' ? 'border-cc-accent/30 bg-cc-accent/10 text-cc-accent' :
                            order.status === 'cancelled' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                            'border-yellow-400/30 bg-yellow-400/10 text-yellow-400'
                          }`}>
                            {STATUS_OPTIONS.find((s) => s.value === order.status)?.label ?? order.status}
                          </span>
                        </div>
                        <div className="text-sm text-cc-muted space-y-0.5">
                          <p>구매자: {order.userName} ({order.userEmail})</p>
                          <p>수령인: {order.shippingName} / {order.shippingPhone}</p>
                          <p>주소: [{order.postalCode}] {order.shippingAddress}{order.shippingDetail ? ` ${order.shippingDetail}` : ''}</p>
                          <p>주문일: {new Date(order.createdAt).toLocaleString('ko-KR')}</p>
                        </div>
                      </div>
                      {/* 상태 직접 변경 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-cc-muted">상태:</span>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={updating === order.id}
                          className="bg-cc-primary border border-white/20 text-cc-text text-sm rounded px-2 py-1.5 focus:outline-none focus:border-cc-accent/50 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 배송 액션 */}
                    <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* 운송장 입력 + 배송 출발 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="운송장 번호 입력"
                          value={trackingInputs[order.id] ?? ''}
                          onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          className="flex-1 min-w-0 bg-cc-primary border border-white/20 text-cc-text text-sm rounded px-3 py-1.5 placeholder-cc-muted focus:outline-none focus:border-cc-accent/50"
                        />
                        <button
                          onClick={() => shipOrder(order.id)}
                          disabled={!!actionLoading[order.id]}
                          className="shrink-0 text-sm px-3 py-1.5 rounded bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                        >
                          {isActing('ship') ? '처리중...' : '📦 배송 출발'}
                        </button>
                      </div>

                      {/* 배송 완료 */}
                      <button
                        onClick={() => deliverOrder(order.id)}
                        disabled={!!actionLoading[order.id]}
                        className="shrink-0 text-sm px-3 py-1.5 rounded bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        {isActing('deliver') ? '처리중...' : '✅ 배송 완료'}
                      </button>

                      {/* 주문확인 알림톡 재발송 */}
                      <button
                        onClick={() => resendNotification(order.id)}
                        disabled={!!actionLoading[order.id]}
                        className="shrink-0 text-sm px-3 py-1.5 rounded bg-white/5 border border-white/20 text-cc-muted hover:text-cc-text hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        {isActing('resend') ? '발송중...' : '🔔 주문확인 재발송'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
    </div>
  );
}
