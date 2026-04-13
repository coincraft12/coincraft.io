'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { apiClient, ApiError } from '@/lib/api-client';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/reset-password', { token, newPassword: password });
      router.replace('/login?reset=success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="cc-glass p-8 max-w-md w-full text-center">
        <p className="text-red-400">유효하지 않은 링크입니다.</p>
        <Link href="/auth/forgot-password" className="cc-btn cc-btn-ghost mt-4 inline-block">비밀번호 재설정 요청</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="cc-glass p-8">
        <h1 className="text-2xl font-bold text-cc-text mb-2">새 비밀번호 설정</h1>
        <p className="text-cc-muted text-sm mb-8">8자 이상, 숫자가 포함된 새 비밀번호를 입력해 주세요.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="새 비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상, 숫자 포함"
            required
          />
          <Input
            label="비밀번호 확인"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            비밀번호 변경
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary flex items-center justify-center pt-16 px-4">
        <Suspense fallback={<Spinner size="lg" />}>
          <ResetPasswordInner />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
