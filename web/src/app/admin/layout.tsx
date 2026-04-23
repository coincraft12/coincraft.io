'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', exact: true },
  { href: '/admin/enroll', label: '무료 입과' },
  { href: '/admin/payments', label: '결제 관리' },
  { href: '/admin/book-orders', label: '도서 주문' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-cc-primary flex flex-col">
      {/* 상단 바 */}
      <header className="h-14 border-b border-white/10 flex items-center px-6 gap-4 shrink-0">
        <Link href="/" className="text-cc-muted hover:text-cc-text text-sm transition-colors">
          ← coincraft.io
        </Link>
        <span className="text-white/20">|</span>
        <span className="text-xs font-bold tracking-widest text-cc-accent uppercase">Admin</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        <aside className="w-48 shrink-0 border-r border-white/10 py-6">
          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cc-accent/10 text-cc-accent'
                      : 'text-cc-muted hover:text-cc-text hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
