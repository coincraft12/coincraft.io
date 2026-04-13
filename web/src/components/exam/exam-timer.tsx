'use client';

import { useState, useEffect, useCallback } from 'react';

interface ExamTimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

export default function ExamTimer({ initialSeconds, onTimeUp }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [triggered, setTriggered] = useState(false);

  const handleTimeUp = useCallback(() => {
    if (!triggered) {
      setTriggered(true);
      onTimeUp();
    }
  }, [triggered, onTimeUp]);

  useEffect(() => {
    if (remaining <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, handleTimeUp]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const isWarning = remaining <= 300; // 5 minutes warning
  const isCritical = remaining <= 60; // 1 minute critical

  const timeStr = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg transition-colors ${
        isCritical
          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
          : isWarning
          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
          : 'bg-white/5 text-cc-text border border-white/10'
      }`}
    >
      <span className="text-sm font-normal opacity-70">남은 시간</span>
      <span>{timeStr}</span>
    </div>
  );
}
