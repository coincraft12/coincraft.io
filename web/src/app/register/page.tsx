'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoogleLoginButton from '@/components/auth/google-login-button';
import KakaoLoginButton from '@/components/auth/kakao-login-button';
import { apiClient, ApiError } from '@/lib/api-client';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    try {
      await apiClient.post('/api/v1/auth/register', {
        name,
        email,
        password,
        ...(cleanPhone.length >= 10 ? { phone: cleanPhone } : {}),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cc-primary flex items-center justify-center pt-16 px-4">
          <div className="w-full max-w-md text-center">
            <div className="cc-glass p-8">
              <div className="text-5xl mb-6">📬</div>
              <h2 className="text-2xl font-bold text-cc-text mb-3">이메일을 확인해 주세요!</h2>
              <p className="text-cc-muted mb-2">
                <span className="text-cc-accent">{email}</span>으로 인증 이메일을 발송했습니다.
              </p>
              <p className="text-cc-muted text-sm">이메일 링크를 클릭하면 계정이 활성화됩니다.</p>
              <Link href="/login" className="cc-btn cc-btn-primary mt-6 inline-block">
                로그인하기
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary flex items-center justify-center pt-16 px-4">
        <div className="w-full max-w-md">
          <div className="cc-glass p-8">
            <h1 className="text-2xl font-bold text-cc-text mb-2">회원가입</h1>
            <p className="text-cc-muted text-sm mb-8">CoinCraft 계정을 만들어 Web3 학습을 시작하세요.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="이름"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                required
              />
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
                placeholder="8자 이상, 숫자 포함"
                required
                autoComplete="new-password"
              />
              <div>
                <Input
                  label="연락처 (선택)"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                />
                <p className="text-xs text-cc-muted mt-1">카카오톡 알림 수신에 사용됩니다.</p>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                회원가입
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-cc-secondary px-3 text-cc-muted">또는 소셜 계정으로 가입</span>
              </div>
            </div>

            <div className="space-y-3">
              <GoogleLoginButton mode="register" />
              <KakaoLoginButton mode="register" />
            </div>

            <p className="mt-6 text-center text-sm text-cc-muted">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-cc-accent hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
