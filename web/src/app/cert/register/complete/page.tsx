'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

function CompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  return (
    <div className="cc-container max-w-lg text-center">
      <div className="bg-cc-secondary border border-white/10 rounded-xl px-8 py-12 space-y-6">
        <div className="text-5xl">✅</div>

        <div>
          <h1 className="text-2xl font-extrabold text-cc-text mb-2">신청 완료</h1>
          <p className="text-cc-muted text-sm">검정 신청 및 결제가 완료되었습니다.</p>
        </div>

        <div className="bg-cc-primary rounded-lg px-6 py-5 text-left space-y-3">
          <div className="flex text-sm">
            <span className="w-28 text-cc-muted shrink-0">시험명</span>
            <span className="text-cc-text font-semibold">WEB3 구조 설계자 검정 Basic · 1회차</span>
          </div>
          <div className="flex text-sm">
            <span className="w-28 text-cc-muted shrink-0">시험일</span>
            <span className="text-cc-text font-semibold">2026년 5월 2일 (토) 오후 2시</span>
          </div>
          <div className="flex text-sm">
            <span className="w-28 text-cc-muted shrink-0">시험 링크 발송</span>
            <span className="text-cc-text">시험 당일 오전 9시, 등록 이메일로 개별 발송</span>
          </div>
          <div className="flex text-sm">
            <span className="w-28 text-cc-muted shrink-0">강의 자료 PDF</span>
            <span className="text-cc-text">4월 21일 이메일 일괄 발송</span>
          </div>
        </div>

        <p className="text-xs text-cc-muted leading-relaxed">
          결제 확인 및 시험 안내는 모두 등록 이메일로 진행됩니다.<br />
          이메일이 오지 않는 경우 스팸함을 확인해주세요.
        </p>

        <div className="space-y-3 pt-2">
          {examId && (
            <Button variant="primary" size="lg" className="w-full" onClick={() => router.push(`/exams/${examId}`)}>
              내 시험 보기
            </Button>
          )}
          <Button variant="ghost" size="md" className="w-full" onClick={() => router.push('/')}>
            홈으로 이동
          </Button>
        </div>

        <p className="text-xs text-cc-muted">
          문의:{' '}
          <a href="mailto:coincraft.edu@gmail.com" className="text-cc-accent hover:underline">
            coincraft.edu@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function CertRegisterCompletePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16 flex items-center justify-center">
        <Suspense fallback={<div className="text-cc-muted">로딩 중...</div>}>
          <CompleteContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
