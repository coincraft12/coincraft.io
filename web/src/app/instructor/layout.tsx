'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Spinner from '@/components/ui/Spinner';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/instructor');
      return;
    }
    if (!isLoading && user && user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user.role !== 'instructor' && user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-cc-primary pt-16">
        {/* Instructor sub-nav */}
        <div className="bg-cc-secondary border-b border-white/10">
          <div className="cc-container">
            <nav className="flex items-center gap-6 h-12 text-sm">
              <a href="/instructor" className="text-cc-muted hover:text-cc-text transition-colors">
                대시보드
              </a>
              <a href="/instructor/courses" className="text-cc-muted hover:text-cc-text transition-colors">
                내 강좌
              </a>
            </nav>
          </div>
        </div>
        <main className="cc-container py-10">{children}</main>
      </div>
      <Footer />
    </>
  );
}
