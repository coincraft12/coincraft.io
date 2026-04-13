'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import { saveToken } from '@/hooks/use-auth-init';
import Spinner from '@/components/ui/Spinner';

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    if (!token) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    saveToken(token);
    setToken(token);

    apiClient
      .get<{ data: any }>('/api/v1/auth/me', { token })
      .then((res) => {
        setUser(res.data);
        router.replace('/');
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed');
      });
  }, [searchParams, router, setUser, setToken]);

  return (
    <main className="min-h-screen bg-cc-primary flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-cc-muted">로그인 처리 중...</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </main>
    }>
      <CallbackInner />
    </Suspense>
  );
}
