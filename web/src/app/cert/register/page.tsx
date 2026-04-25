'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

interface ExamInfo {
  id: string;
  title: string;
  level: string;
  description: string | null;
  examFee: string;
  timeLimit: number;
  passingScore: number;
  registrationStart: string | null;
  registrationEnd: string | null;
}

type PayMethod = 'card' | 'trans' | 'vbank' | 'bank_transfer';

interface PrepareResult {
  orderId: string;
  amount: number;
  examTitle: string;
}

interface BankTransferResult {
  paymentId: string;
  orderId: string;
  amount: number;
  examTitle: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
}


const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const EXAM_SCHEDULE = [
  { label: '시험일', value: '2026년 5월 2일 (토) 오후 2시' },
  { label: '접수 기간', value: '4월 20일(월) ~ 4월 26일(일)' },
  { label: '응시료', value: null },
  { label: '시험 방식', value: '온라인 · 객관식 40문항 · 60분' },
  { label: '합격 기준', value: '100점 만점 · 70점 이상' },
];

export default function CertRegisterPage() {
  const router = useRouter();
  const pathname = usePathname();

  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Form errors
  const [nameError, setNameError] = useState('');
  const [birthdateError, setBirthdateError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [agreeError, setAgreeError] = useState('');

  const [payMethod, setPayMethod] = useState<PayMethod>('card');
  const [bankTransferInfo, setBankTransferInfo] = useState<BankTransferResult | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  // 이미 접수한 계정이면 나의 검정으로 리다이렉트
  useEffect(() => {
    if (!token) return;
    apiClient
      .get<{ success: boolean; data: { id: string; examId: string }[] }>(
        '/api/v1/users/me/exam-registrations',
        { token }
      )
      .then((res) => {
        if (res.data.length > 0) {
          const latest = res.data[res.data.length - 1];
          router.replace(`/exams/${latest.examId}`);
        }
      })
      .catch(() => {});
  }, [token, router]);

  // Pre-fill form from auth store
  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  // Fetch active exam + registration period check
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/exams`)
      .then((r) => r.ok ? r.json() : Promise.reject('fetch fail'))
      .then((j: { success: boolean; data: ExamInfo[] }) => {
        const active = j.data.find((e) => e) ?? j.data[0];
        if (!active) { setFetchError('현재 접수 중인 시험이 없습니다.'); return; }
        const now = new Date();
        if (active.registrationStart && now < new Date(active.registrationStart)) {
          setFetchError('접수 기간이 아닙니다. 접수 기간: 4/20(월) ~ 4/26(일) KST');
          return;
        }
        if (active.registrationEnd && now > new Date(active.registrationEnd)) {
          setFetchError('접수 기간이 마감되었습니다. 접수 기간: 4/20(월) ~ 4/26(일) KST');
          return;
        }
        setExam(active);
      })
      .catch(() => setFetchError('시험 정보를 불러올 수 없습니다.'));
  }, []);

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim()) { setNameError('이름을 입력해주세요.'); valid = false; } else setNameError('');
    if (!/^\d{8}$/.test(birthdate.replace(/-/g, ''))) {
      setBirthdateError('생년월일 8자리를 입력해주세요. (예: 19900101)'); valid = false;
    } else setBirthdateError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('올바른 이메일 주소를 입력해주세요.'); valid = false;
    } else setEmailError('');
    if (!phone.replace(/[^0-9]/g, '') || phone.replace(/[^0-9]/g, '').length < 10) {
      setPhoneError('연락처를 입력해주세요. (카카오톡 알림 발송에 사용됩니다)'); valid = false;
    } else setPhoneError('');
    if (!agreed) { setAgreeError('신청 내용에 동의해주세요.'); valid = false; } else setAgreeError('');
    return valid;
  };

  const handlePayment = async () => {
    if (!validate()) return;
    if (!token || !exam) return;

    setError(null);
    setPaying(true);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanBirthdate = birthdate.replace(/-/g, '');

    try {
      // 무통장 입금
      if (payMethod === 'bank_transfer') {
        const res = await apiClient.post<{ success: boolean; data: BankTransferResult }>(
          '/api/v1/payments/bank-transfer/exams/prepare',
          { examId: exam.id, name: name.trim() || undefined, birthdate: cleanBirthdate || undefined, phone: cleanPhone || undefined },
          { token }
        );
        setBankTransferInfo(res.data);
        setPaying(false);
        return;
      }

      if (!window.IMP) {
        setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        setPaying(false);
        return;
      }

      const prepareRes = await apiClient.post<{ success: boolean; data: PrepareResult }>(
        '/api/v1/payments/exams/prepare',
        { examId: exam.id, name: name.trim() || undefined, birthdate: cleanBirthdate || undefined, phone: cleanPhone || undefined },
        { token }
      );
      const { orderId, amount, examTitle } = prepareRes.data;

      if (payMethod === 'vbank') {
        // 가상계좌
        const impUid = await new Promise<string>((resolve, reject) => {
          window.IMP!.request_pay(
            { pg: 'kcp', pay_method: 'vbank', merchant_uid: orderId, name: examTitle, amount, buyer_email: email, buyer_name: name, buyer_tel: cleanPhone || undefined },
            (rsp) => {
              if (rsp.success && rsp.imp_uid) resolve(rsp.imp_uid);
              else { apiClient.post('/api/v1/payments/cancel', { orderId }, { token: token! }).catch(() => {}); reject(new Error(rsp.error_msg ?? '결제가 취소되었습니다.')); }
            }
          );
        });
        const vbankRes = await apiClient.post<{ success: boolean; data: { vbankNum: string; vbankName: string; vbankHolder: string; vbankDate: number } }>(
          '/api/v1/payments/vbank/confirm', { impUid, orderId, amount }, { token }
        );
        const d = vbankRes.data;
        const expiry = d.vbankDate ? new Date(d.vbankDate * 1000).toLocaleString('ko-KR') : '';
        setError(null);
        setBankTransferInfo({
          paymentId: '',
          orderId,
          amount,
          examTitle,
          bankName: d.vbankName,
          bankAccount: d.vbankNum,
          bankHolder: d.vbankHolder,
        });
        // Show vbank info as a confirmation screen — reuse bankTransferInfo display
        setPaying(false);
        return;
      }

      // 카드 / 계좌이체
      const impUid = await new Promise<string>((resolve, reject) => {
        window.IMP!.request_pay(
          { pg: 'kcp', pay_method: payMethod === 'trans' ? 'trans' : 'card', merchant_uid: orderId, name: examTitle, amount, buyer_email: email, buyer_name: name, buyer_tel: cleanPhone || undefined },
          (rsp) => {
            if (rsp.success && rsp.imp_uid) resolve(rsp.imp_uid);
            else { apiClient.post('/api/v1/payments/cancel', { orderId }, { token: token! }).catch(() => {}); reject(new Error(rsp.error_msg ?? '결제가 취소되었습니다.')); }
          }
        );
      });

      await apiClient.post('/api/v1/payments/exams/confirm', { impUid, orderId, amount }, { token });
      router.push(`/cert/register/complete?examId=${exam.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
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
          <div className="text-center space-y-4">
            <p className="text-red-400">{fetchError}</p>
            <Link href="/cert/apply" className="text-cc-accent hover:underline text-sm">← 검정 신청 안내로 돌아가기</Link>
          </div>
        </main>
      </>
    );
  }

  if (!exam) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary pt-24 flex items-center justify-center">
          <div className="text-cc-muted">시험 정보를 불러오는 중...</div>
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
        <div className="cc-container max-w-2xl">

          {/* 브레드크럼 */}
          <p className="text-xs text-cc-muted mb-6">
            <Link href="/cert" className="hover:text-cc-accent transition-colors">검정 홈</Link>
            {' › '}
            <Link href="/cert/apply" className="hover:text-cc-accent transition-colors">검정 신청 안내</Link>
            {' › '}검정 신청
          </p>

          {/* 타이틀 */}
          <p className="text-center mb-3">
            <span className="inline-block bg-[#0a2463] text-white text-xs px-4 py-1 rounded-full tracking-wide">
              과학기술정보통신부 주무부처 · 정부 등록 민간자격 · 등록번호 2026-002589
            </span>
          </p>
          <h1 className="text-center text-2xl font-extrabold text-cc-text mb-1">검정 신청서</h1>
          <p className="text-center text-cc-muted text-sm mb-10">WEB3 구조 설계자 검정 Basic · 1회차</p>

          <div className="space-y-6">
            {/* 시험 정보 요약 */}
            <div className="bg-cc-secondary border border-white/10 rounded-xl px-6 py-5">
              <h2 className="text-sm font-bold text-cc-text mb-4">시험 정보</h2>
              <div className="space-y-2">
                {EXAM_SCHEDULE.map(({ label, value }) => (
                  <div key={label} className="flex text-sm">
                    <span className="w-28 text-cc-muted shrink-0">{label}</span>
                    {value === null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-cc-muted line-through">60,000원</span>
                        <span className="font-semibold text-cc-accent">30,000원</span>
                        <span className="text-xs font-bold text-red-400">50%</span>
                      </div>
                    ) : (
                      <span className="font-semibold text-cc-text">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 특별 혜택 */}
            <div className="bg-cc-secondary border border-[#0a2463] rounded-xl px-6 py-4">
              <p className="text-xs font-bold text-[#93b4ff] mb-1">1회 검정 신청자 특별 혜택</p>
              <p className="text-sm text-cc-text">
                결제 확인 후 <strong>16챕터 강의 자료 PDF 전원 무료 제공</strong>
              </p>
              <p className="text-xs text-cc-muted mt-1">4월 21일 등록 이메일로 일괄 발송</p>
            </div>

            {/* 신청자 정보 */}
            <div className="bg-cc-secondary border border-white/10 rounded-xl px-6 py-6 space-y-4">
              <h2 className="text-sm font-bold text-cc-text">신청자 정보</h2>
              <Input
                label="이름"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                error={nameError}
              />
              <Input
                label="생년월일"
                type="text"
                value={birthdate}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
                  setBirthdate(v);
                }}
                placeholder="19900101"
                maxLength={8}
                error={birthdateError}
              />
              <p className="text-xs text-cc-muted -mt-2">
                인증서 발급 시 본인 확인에 사용됩니다. 숫자 8자리로 입력해주세요.
              </p>
              <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                error={emailError}
              />
              <p className="text-xs text-cc-muted -mt-2">
                시험 링크, 수험번호, 강의 자료 PDF가 이 이메일로 발송됩니다. 정확하게 입력해주세요.
              </p>
              <Input
                label="연락처"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                error={phoneError}
              />
              <p className="text-xs text-cc-muted -mt-2">
                결제 완료 후 카카오톡 알림이 발송됩니다.
              </p>
            </div>

            {/* 환불 정책 */}
            <div className="bg-cc-secondary border border-white/10 rounded-xl px-6 py-4">
              <h2 className="text-sm font-bold text-cc-text mb-2">환불 정책</h2>
              <p className="text-sm text-cc-muted leading-relaxed">
                시험일 7일 전(4월 25일)까지 전액 환불 가능합니다.<br />
                이후에는 환불이 불가합니다.
              </p>
            </div>

            {/* 동의 및 결제 */}
            <div className="bg-cc-secondary border border-white/10 rounded-xl px-6 py-6 space-y-5">
              {/* 동의 체크 */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-cc-accent"
                />
                <span className="text-sm text-cc-muted leading-relaxed">
                  위 신청 내용과 환불 정책을 확인하였으며, 수험료 결제에 동의합니다.
                </span>
              </label>
              {agreeError && <p className="text-xs text-red-400 -mt-3">{agreeError}</p>}

              {/* 결제 수단 선택 */}
              <div>
                <p className="text-sm font-semibold text-cc-text mb-3">결제 수단</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'card', label: '신용카드' },
                    { value: 'trans', label: '실시간 계좌이체' },
                    { value: 'vbank', label: '가상계좌' },
                    { value: 'bank_transfer', label: '무통장 입금' },
                  ] as { value: PayMethod; label: string }[]).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPayMethod(value)}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        payMethod === value
                          ? 'border-cc-accent text-cc-accent bg-cc-accent/10'
                          : 'border-white/10 text-cc-muted hover:border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {payMethod === 'bank_transfer' && (
                  <p className="text-xs text-cc-muted mt-2">입금 확인 후 영업일 1~2일 내 접수 완료 처리됩니다.</p>
                )}
                {payMethod === 'vbank' && (
                  <p className="text-xs text-cc-muted mt-2">가상계좌 발급 후 입금 기한 내 입금하시면 자동 접수됩니다.</p>
                )}
              </div>

              {/* 결제 금액 요약 */}
              <div className="flex justify-between items-center border-t border-white/10 pt-4">
                <span className="text-cc-muted text-sm">결제 금액</span>
                <span className="text-xl font-bold text-cc-text">
                  {Number(exam.examFee).toLocaleString()}원
                </span>
              </div>

              {/* 무통장 입금 안내 화면 */}
              {bankTransferInfo && (
                <div className="bg-cc-primary rounded-xl p-5 border border-white/10 space-y-3">
                  <p className="text-sm font-bold text-cc-accent">
                    {payMethod === 'vbank' ? '가상계좌가 발급되었습니다' : '무통장 입금 신청이 완료되었습니다'}
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      ['은행', bankTransferInfo.bankName],
                      ['계좌번호', bankTransferInfo.bankAccount],
                      ['예금주', bankTransferInfo.bankHolder],
                      ['입금 금액', `${bankTransferInfo.amount.toLocaleString()}원`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-cc-muted">{label}</span>
                        <span className="text-cc-text font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-cc-muted">카카오톡과 이메일로 안내를 보내드렸습니다.</p>
                  <Button variant="primary" size="md" className="w-full" onClick={() => router.push('/my')}>
                    마이페이지로 이동
                  </Button>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {!bankTransferInfo && (
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={paying}
                    onClick={handlePayment}
                  >
                    {Number(exam.examFee).toLocaleString()}원 결제하기
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
              )}
            </div>

            {/* 문의 */}
            <div className="text-center text-sm text-cc-muted space-y-2 pb-4">
              <p>
                문의:{' '}
                <a href="mailto:contact@coincraft.io" className="text-cc-accent hover:underline">
                  contact@coincraft.io
                </a>
              </p>
              <p>
                <a
                  href="http://pf.kakao.com/_xhPxdxgn/chat"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-[#FEE500] text-[#3A1D1D] text-sm font-bold px-7 py-2.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  카카오톡 빠른 상담
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
