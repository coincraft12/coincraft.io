'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { useAuthStore } from '@/store/auth.store';

export default function EmailVerifiedPage() {
  const { user, isLoading } = useAuthStore();
  useEffect(() => {
    if (!isLoading && user) window.location.replace('/');
  }, [isLoading, user]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary flex items-center justify-center pt-16 px-4">
        <div className="w-full max-w-md text-center">
          <div className="cc-glass p-8">
            <div className="text-5xl mb-6">✅</div>
            <h1 className="text-2xl font-bold text-cc-text mb-3">이메일 인증 완료!</h1>
            <p className="text-cc-muted mb-6">이제 CoinCraft의 모든 서비스를 이용할 수 있습니다.</p>
            <Link href="/login" className="cc-btn cc-btn-primary">로그인하기</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
