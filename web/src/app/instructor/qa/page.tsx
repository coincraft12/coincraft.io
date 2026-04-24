'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { InstructorQADashboard } from '../instructor-qa-dashboard';

export default function InstructorQAPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="cc-label mb-1">INSTRUCTOR</p>
        <h1 className="text-3xl font-bold text-cc-text">Q&A 관리</h1>
        <p className="text-cc-muted mt-1 text-sm">학생 질문을 확인하고 답변을 작성하세요</p>
      </div>
      <InstructorQADashboard />
    </div>
  );
}
