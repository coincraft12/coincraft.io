'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImageUrl: string | null;
  description: string | null;
  stock: number;
}

interface PrepareResult {
  orderId: string;
  amount: number;
  bookTitle: string;
}

export default function BookCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const bookId = params.bookId as string;

  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [book, setBook] = useState<Book | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ impUid: string; orderId: string; amount: number } | null>(null);

  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingDetail, setShippingDetail] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  useEffect(() => {
    if (!bookId) return;
    fetch(`${API_BASE}/api/v1/books`)
      .then((r) => r.json())
      .then((json: { success: boolean; data: Book[] }) => {
        const found = json.data?.find((b) => b.id === bookId);
        if (found) setBook(found);
        else setFetchError('도서 정보를 찾을 수 없습니다.');
      })
      .catch(() => setFetchError('도서 정보를 불러오는 중 오류가 발생했습니다.'));
  }, [bookId]);

  useEffect(() => {
    if (user) {
      setShippingName(user.name ?? '');
    }
  }, [user]);

  const handlePayment = async () => {
    if (!token || !book || !user) return;
    if (!window.IMP) { setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); return; }

    if (!shippingName.trim()) { setError('수령인을 입력해주세요.'); return; }
    if (!shippingPhone.trim()) { setError('연락처를 입력해주세요.'); return; }
    if (!postalCode.trim()) { setError('우편번호를 입력해주세요.'); return; }
    if (!shippingAddress.trim()) { setError('주소를 입력해주세요.'); return; }

    setError(null);
    setPaying(true);

    try {
      // PortOne 결제 후 confirm 실패 시 재시도 — 이중결제 방지
      let confirmData = pendingConfirm;

      if (!confirmData) {
        const prepareRes = await apiClient.post<{ success: boolean; data: PrepareResult }>(
          `/api/v1/books/${bookId}/prepare`,
          { quantity: 1 },
          { token }
        );
        const { orderId, amount, bookTitle } = prepareRes.data;

        const impUid = await new Promise<string>((resolve, reject) => {
          window.IMP!.request_pay(
            {
              pg: 'kcp',
              pay_method: 'card',
              merchant_uid: orderId,
              name: bookTitle,
              amount,
              buyer_email: user.email ?? undefined,
              buyer_name: user.name ?? undefined,
              buyer_tel: shippingPhone,
            },
            (rsp) => {
              if (rsp.success && rsp.imp_uid) {
                resolve(rsp.imp_uid);
              } else {
                reject(new Error(rsp.error_msg ?? '결제가 취소되었습니다.'));
              }
            }
          );
        });

        confirmData = { impUid, orderId, amount };
        setPendingConfirm(confirmData);
      }

      await apiClient.post(
        `/api/v1/books/${bookId}/confirm`,
        {
          impUid: confirmData.impUid,
          orderId: confirmData.orderId,
          amount: confirmData.amount,
          shippingName: shippingName.trim(),
          shippingPhone: shippingPhone.trim(),
          postalCode: postalCode.trim(),
          shippingAddress: shippingAddress.trim(),
          shippingDetail: shippingDetail.trim() || undefined,
          quantity: 1,
        },
        { token }
      );

      router.push('/my?tab=books');
    } catch (err) {
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

  if (!book) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <div className="text-cc-muted">도서 정보를 불러오는 중...</div>
        </main>
      </>
    );
  }

  const openAddressSearch = () => {
    if (!window.daum?.Postcode) { alert('주소 검색 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    new window.daum.Postcode({
      oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => {
        setPostalCode(data.zonecode);
        setShippingAddress(data.roadAddress || data.jibunAddress);
      },
    }).open();
  };

  return (
    <>
      <Script src="https://cdn.iamport.kr/v1/iamport.js" onLoad={() => { window.IMP!.init('imp56544661'); }} />
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" />
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-cc-text mb-8">종이책 구매</h1>

          <div className="space-y-5">
            {/* 상품 정보 */}
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6">
              <h2 className="text-sm font-semibold text-cc-muted mb-4">주문 상품</h2>
              <div className="flex gap-4">
                {book.coverImageUrl ? (
                  <img src={book.coverImageUrl} alt={book.title} className="w-16 h-24 object-cover rounded" />
                ) : (
                  <div className="w-16 h-24 bg-cc-primary rounded flex items-center justify-center">
                    <span className="text-2xl opacity-30">📚</span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-cc-muted">{book.author}</p>
                  <h3 className="text-cc-text font-semibold mt-1">{book.title}</h3>
                  <p className="text-cc-accent font-bold mt-2">{book.price.toLocaleString('ko-KR')}원</p>
                </div>
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-4">
              <h2 className="text-sm font-semibold text-cc-muted">배송 정보</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-cc-muted mb-1">수령인 *</label>
                  <input
                    type="text"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    placeholder="수령인 이름"
                    className="w-full bg-cc-primary border border-white/20 rounded px-3 py-2 text-sm text-cc-text placeholder:text-cc-muted/50 focus:outline-none focus:border-cc-accent/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-cc-muted mb-1">연락처 *</label>
                  <input
                    type="tel"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full bg-cc-primary border border-white/20 rounded px-3 py-2 text-sm text-cc-text placeholder:text-cc-muted/50 focus:outline-none focus:border-cc-accent/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-cc-muted mb-1">우편번호 *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={postalCode}
                      readOnly
                      placeholder="우편번호"
                      className="w-28 bg-cc-primary border border-white/20 rounded px-3 py-2 text-sm text-cc-text placeholder:text-cc-muted/50 focus:outline-none cursor-default"
                    />
                    <button
                      type="button"
                      onClick={openAddressSearch}
                      className="flex-1 bg-cc-accent/10 border border-cc-accent/40 hover:bg-cc-accent/20 text-cc-accent text-sm rounded px-3 py-2 transition-colors"
                    >
                      주소 검색
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-cc-muted mb-1">주소 *</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    readOnly
                    placeholder="주소 검색 버튼을 눌러주세요"
                    className="w-full bg-cc-primary border border-white/20 rounded px-3 py-2 text-sm text-cc-text placeholder:text-cc-muted/50 focus:outline-none cursor-default"
                  />
                </div>

                <div>
                  <label className="block text-xs text-cc-muted mb-1">상세 주소</label>
                  <input
                    type="text"
                    value={shippingDetail}
                    onChange={(e) => setShippingDetail(e.target.value)}
                    placeholder="동/호수 등"
                    className="w-full bg-cc-primary border border-white/20 rounded px-3 py-2 text-sm text-cc-text placeholder:text-cc-muted/50 focus:outline-none focus:border-cc-accent/50"
                  />
                </div>
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6">
              <div className="flex justify-between items-center">
                <span className="text-cc-muted text-sm">결제 금액</span>
                <span className="text-xl font-bold text-cc-text">{book.price.toLocaleString('ko-KR')}원</span>
              </div>
              <p className="text-xs text-cc-muted mt-2">주문 후 2~3일 이내 발송됩니다.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full" loading={paying} onClick={handlePayment}>
                {book.price.toLocaleString('ko-KR')}원 결제하기
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
