'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

interface WishlistItem {
  wishlistId: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: string;
  salePrice: string | null;
  addedAt: string;
}

export default function MyWishlistPage() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoading, token, router, pathname]);

  const { data, isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['my-wishlists'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: WishlistItem[] }>(
        '/api/v1/users/me/wishlists',
        { token: token ?? undefined }
      );
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
            <p className="cc-label mb-2">MY WISHLIST</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">위시리스트</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <p className="text-5xl">♡</p>
              <p className="text-cc-muted">저장한 강좌가 없습니다.</p>
              <Button variant="outline" onClick={() => router.push('/courses')}>
                강좌 둘러보기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {data.map((item) => (
                <div
                  key={item.wishlistId}
                  className="bg-cc-secondary border border-white/10 rounded-cc overflow-hidden hover:border-cc-accent/40 transition-colors cursor-pointer"
                  onClick={() => router.push(`/courses/${item.slug}`)}
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                      <span className="text-3xl">🎓</span>
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="text-cc-text font-semibold text-sm leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-cc-accent font-semibold text-sm">
                      {Number(item.salePrice ?? item.price) === 0
                        ? '무료'
                        : `${Number(item.salePrice ?? item.price).toLocaleString('ko-KR')}원`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
