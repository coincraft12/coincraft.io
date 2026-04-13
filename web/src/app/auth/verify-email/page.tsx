'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Spinner from '@/components/ui/Spinner';
import { apiClient, ApiError } from '@/lib/api-client';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('유효하지 않은 링크입니다.');
      return;
    }

    apiClient
      .post('/api/v1/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : '인증에 실패했습니다.');
      });
  }, [searchParams]);

  return (
    <div className="w-full max-w-md text-center">
      <div className="cc-glass p-8">
        {status === 'loading' && (
          <>
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-cc-muted">이메일 인증 중...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-cc-text mb-3">이메일 인증 완료!</h2>
            <p className="text-cc-muted mb-6">이제 CoinCraft의 모든 서비스를 이용할 수 있습니다.</p>
            <Link href="/login" className="cc-btn cc-btn-primary">로그인하기</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-cc-text mb-3">인증 실패</h2>
            <p className="text-cc-muted mb-6">{message}</p>
            <Link href="/login" className="cc-btn cc-btn-ghost">로그인 페이지로</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary flex items-center justify-center pt-16 px-4">
        <Suspense fallback={<Spinner size="lg" />}>
          <VerifyEmailInner />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
