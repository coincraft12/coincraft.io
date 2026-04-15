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
}

interface PrepareResult {
  orderId: string;
  amount: number;
  examTitle: string;
}

declare global {
  interface Window {
    IMP?: {
      init: (impCode: string) => void;
      request_pay: (
        params: {
          pg?: string;
          pay_method?: string;
          merchant_uid: string;
          name: string;
          amount: number;
          buyer_email?: string;
          buyer_name?: string;
          buyer_tel?: string;
        },
        callback: (rsp: { success: boolean; imp_uid?: string; error_msg?: string }) => void
      ) => void;
    };
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const EXAM_SCHEDULE = [
  { label: '시험일', value: '2026년 5월 2일 (토) 오후 2시' },
  { label: '접수 기간', value: '4월 14일(월) ~ 4월 20일(일)' },
  { label: '응시료', value: '30,000원' },
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

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  // Pre-fill form from auth store
  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  // Fetch active exam
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/exams`)
      .then((r) => r.ok ? r.json() : Promise.reject('fetch fail'))
      .then((j: { success: boolean; data: ExamInfo[] }) => {
        const active = j.data.find((e) => e) ?? j.data[0];
        if (active) {
          setExam(active);
        } else {
          setFetchError('현재 접수 중인 시험이 없습니다.');
        }
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
    if (!window.IMP) {
      setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setError(null);
    setPaying(true);

    try {
      const prepareRes = await apiClient.post<{ success: boolean; data: PrepareResult }>(
        '/api/v1/payments/exams/prepare',
        { examId: exam.id, name: name.trim() || undefined, birthdate: birthdate.replace(/-/g, '') || undefined, phone: phone.replace(/[^0-9]/g, '') || undefined },
        { token }
      );
      const { orderId, amount, examTitle } = prepareRes.data;

      const impUid = await new Promise<string>((resolve, reject) => {
        window.IMP!.request_pay(
          {
            pg: 'kcp',
            pay_method: 'card',
            merchant_uid: orderId,
            name: examTitle,
            amount,
            buyer_email: email,
            buyer_name: name,
            buyer_tel: phone || undefined,
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

      await apiClient.post('/api/v1/payments/exams/confirm', { impUid, orderId, amount }, { token });

      router.push(`/cert/register/complete?examId=${exam.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : '결제 처리 중 오류가 발생했습니다.'
      );
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
                    <span className="font-semibold text-cc-text">{value}</span>
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

              {/* 결제 금액 요약 */}
              <div className="flex justify-between items-center border-t border-white/10 pt-4">
                <span className="text-cc-muted text-sm">결제 금액</span>
                <span className="text-xl font-bold text-cc-text">
                  {Number(exam.examFee).toLocaleString()}원
                </span>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

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
            </div>

            {/* 문의 */}
            <div className="text-center text-sm text-cc-muted space-y-2 pb-4">
              <p>
                문의:{' '}
                <a href="mailto:coincraft.edu@gmail.com" className="text-cc-accent hover:underline">
                  coincraft.edu@gmail.com
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
