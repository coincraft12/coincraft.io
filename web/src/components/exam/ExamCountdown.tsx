'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';

interface Props {
  examId: string;
  scheduledAt: string; // ISO string
}

interface MyStatus {
  status: 'not_started' | 'in_progress' | 'submitted' | 'abandoned';
  isPassed?: boolean | null;
  score?: number | null;
  attemptId?: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getRemaining(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export default function ExamCountdown({ examId, scheduledAt }: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const target = useMemo(() => new Date(scheduledAt), [scheduledAt]);
  const [remaining, setRemaining] = useState(() => getRemaining(target));
  const [myStatus, setMyStatus] = useState<MyStatus | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemaining(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledAt]);

  useEffect(() => {
    if (isAuthLoading || !token) return;
    apiClient.get<{ success: boolean; data: MyStatus }>(
      `/api/v1/exams/${examId}/my-status`,
      { token }
    ).then((res) => setMyStatus(res.data)).catch(() => {});
  }, [examId, token, isAuthLoading]);

  const isOpen = remaining === null;

  // 제출 완료 상태
  if (myStatus?.status === 'submitted') {
    const passed = myStatus.isPassed;
    return (
      <div className="space-y-4">
        <div className={`rounded-xl p-5 text-center ${passed ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <p className="text-2xl mb-2">{passed ? '🎉' : '📚'}</p>
          <p className={`font-bold text-base ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {passed ? '합격' : '불합격'} — {myStatus.score}점
          </p>
          <p className="text-xs text-cc-muted mt-1">이미 제출 완료된 시험입니다.</p>
        </div>
        <button
          onClick={() => router.push(passed ? '/my/certificates' : '/exams')}
          className="w-full py-4 rounded-xl bg-cc-accent text-[#0f172a] font-bold text-base hover:opacity-90 transition-opacity"
        >
          {passed ? '내 자격증 보기' : '시험 목록으로'}
        </button>
      </div>
    );
  }

  // 진행 중 (이어받기)
  if (myStatus?.status === 'in_progress') {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
          <p className="text-yellow-400 text-sm font-semibold">진행 중인 시험이 있습니다</p>
          <p className="text-xs text-cc-muted mt-1">이어서 응시할 수 있습니다.</p>
        </div>
        <button
          onClick={() => router.push(`/exams/${examId}/attempt`)}
          className="w-full py-4 rounded-xl bg-yellow-400 text-[#0f172a] font-bold text-base hover:opacity-90 transition-opacity"
        >
          시험 이어받기
        </button>
      </div>
    );
  }

  // 미응시 — 카운트다운 또는 시작 버튼
  return (
    <div className="space-y-4">
      {!isOpen && remaining && (
        <div className="bg-cc-primary rounded-xl p-5 text-center">
          <p className="text-xs text-cc-muted mb-3">시험 시작까지</p>
          <div className="flex justify-center gap-3">
            {remaining.days > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-cc-accent tabular-nums">{pad(remaining.days)}</span>
                <span className="text-xs text-cc-muted mt-1">일</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-cc-text tabular-nums">{pad(remaining.hours)}</span>
              <span className="text-xs text-cc-muted mt-1">시간</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-cc-text tabular-nums">{pad(remaining.minutes)}</span>
              <span className="text-xs text-cc-muted mt-1">분</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-cc-text tabular-nums">{pad(remaining.seconds)}</span>
              <span className="text-xs text-cc-muted mt-1">초</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => isOpen && router.push(`/exams/${examId}/attempt`)}
        disabled={!isOpen}
        className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
          isOpen
            ? 'bg-cc-accent text-[#0f172a] hover:opacity-90 cursor-pointer'
            : 'bg-cc-secondary text-cc-muted cursor-not-allowed border border-white/10'
        }`}
      >
        {isOpen ? '시험 시작하기' : '시험 시작 전 (시험일에 활성화)'}
      </button>
    </div>
  );
}
