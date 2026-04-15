'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  examId: string;
  scheduledAt: string; // ISO string
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
  const target = new Date(scheduledAt);
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemaining(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledAt]);

  const isOpen = remaining === null;

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
