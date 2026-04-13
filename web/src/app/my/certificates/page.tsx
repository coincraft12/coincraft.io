'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import CertificateCard from '@/components/my/certificate-card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

interface CertificateItem {
  id: string;
  certNumber: string;
  level: string;
  issuedAt: string;
  expiresAt: string | null;
  examId: string | null;
}

interface CertificatesResponse {
  success: boolean;
  data: CertificateItem[];
}

export default function MyCertificatesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoading, token, router, pathname]);

  const { data, isLoading } = useQuery<CertificateItem[]>({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const res = await apiClient.get<CertificatesResponse>('/api/v1/users/me/certificates', {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: !!token,
  });

  if (isAuthLoading || !token) {
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
            <p className="cc-label mb-2">MY CERTIFICATION</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">내 자격증</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <p className="text-5xl">🏆</p>
              <p className="text-cc-muted">취득한 자격증이 없습니다.</p>
              <Button variant="outline" onClick={() => router.push('/exams')}>
                시험 보러 가기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {data.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  id={cert.id}
                  certNumber={cert.certNumber}
                  level={cert.level}
                  issuedAt={cert.issuedAt}
                  expiresAt={cert.expiresAt}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
