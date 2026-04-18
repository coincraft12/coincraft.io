'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Spinner from '@/components/ui/Spinner';

const MENU_ITEMS = [
  { href: '/my/courses', icon: '🎓', label: '내 강좌', desc: '수강 중인 강좌와 전자책' },
  { href: '/my/certificates', icon: '🏆', label: '내 자격증', desc: '취득한 COINCRAFT 자격증' },
  { href: '/my/wishlist', icon: '♥', label: '위시리스트', desc: '저장한 강좌 목록' },
  { href: '/my/payments', icon: '💳', label: '결제 내역', desc: '구매 및 결제 이력' },
  { href: '/exams', icon: '📋', label: '자격 시험', desc: '검정 시험 목록 및 응시' },
  { href: '/courses', icon: '📚', label: '강좌 탐색', desc: '전체 강좌 둘러보기' },
];

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-10">
            <p className="cc-label mb-2">MY PAGE</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">
              안녕하세요, {user.name}님
            </h1>
            <p className="text-cc-muted mt-2">{user.email}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-3 hover:border-cc-accent/30 transition-colors"
              >
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <p className="text-cc-text font-semibold">{item.label}</p>
                  <p className="text-cc-muted text-sm mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
