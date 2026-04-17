'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoogleLoginButton from '@/components/auth/google-login-button';
import KakaoLoginButton from '@/components/auth/kakao-login-button';
import Web3LoginButton from '@/components/auth/web3-login-button';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { saveToken } from '@/hooks/use-auth-init';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken, user, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && user) window.location.replace('/');
  }, [isLoading, user]);
  // 오픈 리다이렉트 방지: 상대 경로(/)로 시작하는 경우만 허용
  const rawRedirect = searchParams.get('redirect') ?? '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
  const oauthError = searchParams.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post<{ data: { accessToken: string; user: any } }>(
        '/api/v1/auth/login',
        { email, password }
      );
      saveToken(res.data.accessToken);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cc-glass p-8">
      <h1 className="text-2xl font-bold text-cc-text mb-2">로그인</h1>
      <p className="text-cc-muted text-sm mb-8">CoinCraft 계정으로 로그인하세요.</p>

      {oauthError === 'cancelled' && (
        <p className="text-cc-muted text-sm mb-4 bg-white/5 rounded px-3 py-2">소셜 로그인이 취소되었습니다.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일을 입력하세요"
          required
          autoComplete="email"
        />
        <Input
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          required
          autoComplete="current-password"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs text-cc-muted hover:text-cc-accent">
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          로그인
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-cc-secondary px-3 text-cc-muted">또는 소셜 계정으로 로그인</span>
        </div>
      </div>

      <div className="space-y-3">
        <GoogleLoginButton redirectTo={redirectTo} />
        <KakaoLoginButton redirectTo={redirectTo} />
        <Web3LoginButton />
      </div>

      <p className="mt-6 text-center text-sm text-cc-muted">
        계정이 없으신가요?{' '}
        <Link href="/register" className="text-cc-accent hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary flex items-center justify-center pt-16 px-4">
        <div className="w-full max-w-md">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
