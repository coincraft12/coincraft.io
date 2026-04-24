'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { InstructorQADashboard } from './instructor-qa-dashboard';

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
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Q&A 관리</h1>
          <p className="text-slate-400 mt-2">학생 질문을 확인하고 답변을 작성하세요</p>
        </div>

        <InstructorQADashboard />
      </div>
    </div>
  );
}
