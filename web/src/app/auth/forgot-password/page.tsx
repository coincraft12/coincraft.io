'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { apiClient, ApiError } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary flex items-center justify-center pt-16 px-4">
        <div className="w-full max-w-md">
          <div className="cc-glass p-8">
            {success ? (
              <div className="text-center">
                <div className="text-5xl mb-4">📬</div>
                <h2 className="text-2xl font-bold text-cc-text mb-3">이메일을 확인해 주세요</h2>
                <p className="text-cc-muted mb-6">
                  비밀번호 재설정 링크를 <span className="text-cc-accent">{email}</span>으로 발송했습니다.<br />
                  15분 안에 링크를 클릭해 주세요.
                </p>
                <Link href="/login" className="cc-btn cc-btn-ghost">로그인으로</Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-cc-text mb-2">비밀번호 재설정</h1>
                <p className="text-cc-muted text-sm mb-8">가입 시 사용한 이메일 주소를 입력하시면 재설정 링크를 발송해 드립니다.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="이메일"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일을 입력하세요"
                    required
                  />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button type="submit" variant="primary" className="w-full" loading={loading}>
                    재설정 링크 발송
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-cc-muted">
                  <Link href="/login" className="text-cc-accent hover:underline">로그인으로 돌아가기</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
