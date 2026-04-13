'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get('status'); // 'success' | 'fail'
  const courseSlug = searchParams.get('courseSlug');
  const message = searchParams.get('message');

  if (status === 'success' && courseSlug) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-cc-text">결제 완료!</h1>
          <p className="text-cc-muted mt-2">강좌 수강 신청이 완료되었습니다.</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push(`/courses/${courseSlug}`)}
        >
          강좌 시작하기
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-cc-text">결제 실패</h1>
        <p className="text-cc-muted mt-2">{message ?? '결제 처리 중 오류가 발생했습니다.'}</p>
      </div>
      <Button
        variant="ghost"
        size="lg"
        onClick={() => router.back()}
      >
        돌아가기
      </Button>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16 flex items-center justify-center">
        <div className="cc-container max-w-md mx-auto">
          <div className="bg-cc-secondary border border-white/10 rounded-cc p-8">
            <Suspense fallback={<div className="text-cc-muted text-center">로딩 중...</div>}>
              <ResultContent />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
