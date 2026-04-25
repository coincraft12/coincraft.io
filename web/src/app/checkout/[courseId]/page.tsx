'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

interface PrepareResult {
  orderId: string;
  amount: number;
  courseName: string;
}

interface CourseInfo {
  id: string;
  slug: string;
  title: string;
  price: string;
  thumbnailUrl: string | null;
  shortDescription: string | null;
}

interface VbankInfo {
  vbankNum: string;
  vbankName: string;
  vbankHolder: string;
  vbankDate: number;
  orderId: string;
}

interface BankTransferInfo {
  paymentId: string;
  orderId: string;
  amount: number;
  courseName: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
}

type PayMethod = 'card' | 'trans' | 'vbank' | 'bank_transfer';

const PAY_METHODS: { value: PayMethod; label: string; desc: string }[] = [
  { value: 'card', label: '신용카드', desc: '국내외 모든 카드 결제' },
  { value: 'trans', label: '실시간 계좌이체', desc: '인터넷뱅킹 즉시 이체' },
  { value: 'vbank', label: '가상계좌', desc: '발급된 가상계좌로 입금 후 자동 수강 처리' },
  { value: 'bank_transfer', label: '무통장 입금', desc: '코인크래프트 법인 계좌로 직접 입금 · 관리자 확인 후 수강 처리' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const courseId = params.courseId as string;

  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [courseFetchError, setCourseFetchError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>('card');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vbankInfo, setVbankInfo] = useState<VbankInfo | null>(null);
  const [bankTransferInfo, setBankTransferInfo] = useState<BankTransferInfo | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  useEffect(() => {
    if (!courseId) return;
    async function fetchCourse() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/courses/${courseId}`);
        if (!res.ok) { setCourseFetchError('강좌 정보를 불러올 수 없습니다.'); return; }
        const json = await res.json() as { success: boolean; data: CourseInfo };
        setCourse(json.data);
      } catch {
        setCourseFetchError('강좌 정보를 불러오는 중 오류가 발생했습니다.');
      }
    }
    fetchCourse();
  }, [courseId]);

  const handlePayment = async () => {
    if (!token || !course) return;

    setError(null);
    setPaying(true);

    try {
      // 무통장 입금 — PortOne 없이 직접 처리
      if (payMethod === 'bank_transfer') {
        const res = await apiClient.post<{ success: boolean; data: BankTransferInfo }>(
          '/api/v1/payments/bank-transfer/prepare',
          { courseId: course.id },
          { token }
        );
        setBankTransferInfo(res.data);
        setPaying(false);
        return;
      }

      if (!window.IMP) { setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); setPaying(false); return; }

      const prepareRes = await apiClient.post<{ success: boolean; data: PrepareResult }>(
        '/api/v1/payments/prepare',
        { courseId: course.id },
        { token }
      );
      const { orderId, amount, courseName } = prepareRes.data;

      const rsp = await new Promise<{
        success: boolean; imp_uid?: string; error_msg?: string;
        vbank_num?: string; vbank_name?: string; vbank_holder?: string; vbank_date?: number;
      }>((resolve) => {
        window.IMP!.request_pay(
          {
            pg: 'kcp',
            pay_method: payMethod,
            merchant_uid: orderId,
            name: courseName,
            amount,
            buyer_email: user?.email ?? undefined,
            buyer_name: user?.name ?? undefined,
          },
          resolve
        );
      });

      if (!rsp.success || !rsp.imp_uid) {
        apiClient.post('/api/v1/payments/cancel', { orderId }, { token }).catch(() => {});
        throw new Error(rsp.error_msg ?? '결제가 취소되었습니다.');
      }

      if (payMethod === 'vbank') {
        const vbankRes = await apiClient.post<{ success: boolean; data: VbankInfo }>(
          '/api/v1/payments/vbank/confirm',
          { impUid: rsp.imp_uid, orderId, amount },
          { token }
        );
        setVbankInfo(vbankRes.data);
        setPaying(false);
        return;
      }

      const confirmRes = await apiClient.post<{ success: boolean; data: { courseId: string; courseSlug: string } }>(
        '/api/v1/payments/confirm',
        { impUid: rsp.imp_uid, orderId, amount },
        { token }
      );

      router.push(`/courses/${confirmRes.data.courseSlug}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_ENROLLED') {
        router.replace(`/courses/${course.slug}`);
        return;
      }
      setError(err instanceof ApiError ? err.message : (err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.'));
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

  if (courseFetchError) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <div className="text-red-400">{courseFetchError}</div>
        </main>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <div className="text-cc-muted">강좌 정보를 불러오는 중...</div>
        </main>
      </>
    );
  }

  // 무통장 입금 안내 화면
  if (bankTransferInfo) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 pb-16">
          <div className="cc-container max-w-xl mx-auto">
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-5">
              <div className="text-center">
                <div className="text-3xl mb-3">🏦</div>
                <h1 className="text-xl font-bold text-cc-text">무통장 입금 안내</h1>
                <p className="text-cc-muted text-sm mt-1">아래 계좌로 입금하시면 관리자 확인 후 수강이 시작됩니다.</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-cc-muted">은행</span>
                  <span className="text-cc-text font-semibold">{bankTransferInfo.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cc-muted">계좌번호</span>
                  <span className="text-cc-text font-mono font-semibold">{bankTransferInfo.bankAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cc-muted">예금주</span>
                  <span className="text-cc-text font-semibold">{bankTransferInfo.bankHolder}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="text-cc-muted">입금 금액</span>
                  <span className="text-cc-accent font-bold">{bankTransferInfo.amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cc-muted">강좌명</span>
                  <span className="text-cc-text text-right max-w-[60%]">{bankTransferInfo.courseName}</span>
                </div>
              </div>
              <div className="bg-[#0a2463]/30 border border-[#0a2463] rounded-lg p-3 text-xs text-cc-muted space-y-1">
                <p>· 입금자명은 <strong className="text-cc-text">가입 시 이름</strong>과 동일하게 입력해주세요.</p>
                <p>· 확인은 영업일 기준 1~2일 내 처리됩니다.</p>
                <p>· 문의: <a href="mailto:contact@coincraft.io" className="text-cc-accent hover:underline">contact@coincraft.io</a></p>
              </div>
              <Button variant="ghost" size="md" className="w-full" onClick={() => router.push('/')}>
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // 가상계좌 발급 완료 화면
  if (vbankInfo) {
    const expiry = new Date(vbankInfo.vbankDate * 1000);
    const expiryStr = `${expiry.getFullYear()}.${String(expiry.getMonth()+1).padStart(2,'0')}.${String(expiry.getDate()).padStart(2,'0')} ${String(expiry.getHours()).padStart(2,'0')}:${String(expiry.getMinutes()).padStart(2,'0')}`;
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 pb-16">
          <div className="cc-container max-w-xl mx-auto">
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-5">
              <div className="text-center">
                <div className="text-3xl mb-3">🏦</div>
                <h1 className="text-xl font-bold text-cc-text">가상계좌가 발급되었습니다</h1>
                <p className="text-cc-muted text-sm mt-1">아래 계좌로 입금하시면 수강이 시작됩니다.</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-cc-muted">은행</span>
                  <span className="text-cc-text font-semibold">{vbankInfo.vbankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cc-muted">계좌번호</span>
                  <span className="text-cc-text font-mono font-semibold">{vbankInfo.vbankNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cc-muted">예금주</span>
                  <span className="text-cc-text font-semibold">{vbankInfo.vbankHolder}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="text-cc-muted">입금 금액</span>
                  <span className="text-cc-accent font-bold">{Number(course.price).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cc-muted">입금 기한</span>
                  <span className="text-red-400 font-semibold">{expiryStr}</span>
                </div>
              </div>
              <p className="text-xs text-cc-muted text-center">
                입금 기한 내 입금하지 않으면 주문이 자동 취소됩니다.
              </p>
              <Button variant="ghost" size="md" className="w-full" onClick={() => router.push('/')}>
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Script
        src="https://cdn.iamport.kr/v1/iamport.js"
        onLoad={() => { window.IMP!.init('imp56544661'); }}
      />
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-cc-text mb-8">결제</h1>

          <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-6">
            {/* Course info */}
            <div className="flex gap-4">
              {course.thumbnailUrl && (
                <img src={course.thumbnailUrl} alt={course.title} className="w-24 h-16 object-cover rounded" />
              )}
              <div>
                <h2 className="text-cc-text font-semibold">{course.title}</h2>
                {course.shortDescription && (
                  <p className="text-cc-muted text-sm mt-1">{course.shortDescription}</p>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <span className="text-cc-muted">결제 금액</span>
              <span className="text-xl font-bold text-cc-text">{Number(course.price).toLocaleString()}원</span>
            </div>

            {/* Payment method */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <p className="text-sm text-cc-muted mb-3">결제 수단</p>
              {PAY_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    payMethod === m.value
                      ? 'border-cc-accent bg-cc-accent/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    value={m.value}
                    checked={payMethod === m.value}
                    onChange={() => setPayMethod(m.value)}
                    className="accent-cc-accent"
                  />
                  <div>
                    <div className="text-cc-text text-sm font-medium">{m.label}</div>
                    <div className="text-cc-muted text-xs">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Buyer info */}
            <div className="text-sm text-cc-muted border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span>구매자</span>
                <span className="text-cc-text">{user?.name}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>이메일</span>
                <span className="text-cc-text">{user?.email}</span>
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
              <Button variant="primary" size="lg" className="w-full" loading={paying} onClick={handlePayment}>
                {Number(course.price).toLocaleString()}원{' '}
                {payMethod === 'bank_transfer' ? '무통장 입금 신청' : payMethod === 'vbank' ? '가상계좌 발급' : payMethod === 'trans' ? '계좌이체 결제' : '카드 결제'}
              </Button>
              <Button variant="ghost" size="md" className="w-full" onClick={() => router.back()} disabled={paying}>
                취소
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
