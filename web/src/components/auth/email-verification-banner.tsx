'use client';

import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (!user || user.emailVerified) return null;

  async function resend() {
    setStatus('sending');
    try {
      await apiClient.post('/api/v1/auth/resend-verification', { email: user!.email });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
    }
  }

  return (
    <div className="bg-cc-accent/10 border-b border-cc-accent/30 py-2 px-4">
      <div className="cc-container flex items-center justify-between gap-4 text-sm">
        <p className="text-cc-accent">
          이메일 인증이 필요합니다. <span className="text-cc-muted">{user.email}</span>로 발송된 인증 링크를 확인해 주세요.
        </p>
        <button
          onClick={resend}
          disabled={status === 'sending' || status === 'sent'}
          className="shrink-0 text-xs text-cc-accent underline hover:no-underline disabled:opacity-50"
        >
          {status === 'idle' && '재발송'}
          {status === 'sending' && '발송 중...'}
          {status === 'sent' && '발송 완료 ✓'}
          {status === 'error' && '재시도'}
        </button>
      </div>
    </div>
  );
}
