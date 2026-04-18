'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Spinner from '@/components/ui/Spinner';

const MENU_ITEMS = [
  { href: '/my/courses', icon: '🎓', label: '내 강좌', desc: '수강 중인 강좌와 전자책' },
  { href: '/my/certificates', icon: '🏆', label: '내 자격증', desc: '취득한 COINCRAFT 자격증' },
  { href: '/my/payments', icon: '💳', label: '결제 내역', desc: '구매 및 결제 이력' },
  { href: '/exams', icon: '📋', label: '자격 시험', desc: '검정 시험 목록 및 응시' },
  { href: '/courses', icon: '📚', label: '강좌 탐색', desc: '전체 강좌 둘러보기' },
];

interface BookOrder {
  id: string;
  bookTitle: string;
  coverImageUrl: string | null;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface WishlistItem {
  wishlistId: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: string;
  originalPrice: string | null;
}

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  const { data: wishlists } = useQuery<WishlistItem[]>({
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

  const { data: bookOrders } = useQuery<BookOrder[]>({
    queryKey: ['my-book-orders'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: BookOrder[] }>(
        '/api/v1/users/me/book-orders',
        { token: token ?? undefined }
      );
      return res.data;
    },
    enabled: !!token,
  });

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
        <div className="cc-container space-y-12">
          <div>
            <p className="cc-label mb-2">MY PAGE</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">
              안녕하세요, {user.name}님
            </h1>
            <p className="text-cc-muted mt-2">{user.email}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
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

          {/* 위시리스트 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-xl">♥</span>
                <h2 className="text-lg font-semibold text-cc-text">위시리스트</h2>
                {wishlists && wishlists.length > 0 && (
                  <span className="text-xs text-cc-accent bg-cc-accent/10 border border-cc-accent/20 px-2 py-0.5 rounded-full">
                    {wishlists.length}개
                  </span>
                )}
              </div>
              {wishlists && wishlists.length > 4 && (
                <Link href="/my/wishlist" className="text-sm text-cc-muted hover:text-cc-accent transition-colors">
                  전체 보기 →
                </Link>
              )}
            </div>

            {!wishlists ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" />
              </div>
            ) : wishlists.length === 0 ? (
              <div className="bg-cc-secondary border border-white/10 rounded-cc p-10 text-center space-y-3">
                <p className="text-3xl">♡</p>
                <p className="text-cc-muted text-sm">저장한 강좌가 없습니다.</p>
                <Link href="/courses" className="inline-block text-sm text-cc-accent hover:underline">
                  강좌 둘러보기 →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {wishlists.slice(0, 4).map((item) => (
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
                    <div className="p-4 space-y-1">
                      <h3 className="text-cc-text font-semibold text-sm leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-cc-accent font-semibold text-sm">
                        {Number(item.price) === 0
                          ? '무료'
                          : `${Number(item.price).toLocaleString('ko-KR')}원`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 내 구매 이력 */}
          {bookOrders && bookOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📦</span>
                  <h2 className="text-lg font-semibold text-cc-text">내 구매 이력</h2>
                  <span className="text-xs text-cc-accent bg-cc-accent/10 border border-cc-accent/20 px-2 py-0.5 rounded-full">
                    {bookOrders.length}건
                  </span>
                </div>
                {bookOrders.length > 3 && (
                  <Link href="/shop" className="text-sm text-cc-muted hover:text-cc-accent transition-colors">
                    전체 보기 →
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {bookOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="bg-cc-secondary border border-white/10 rounded-cc p-4 flex items-center gap-4">
                    {order.coverImageUrl ? (
                      <img src={order.coverImageUrl} alt={order.bookTitle} className="w-12 h-16 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-16 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-xl opacity-30">📚</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-cc-text font-semibold text-sm leading-snug line-clamp-1">{order.bookTitle}</p>
                      <p className="text-cc-muted text-xs mt-1">{order.totalAmount.toLocaleString('ko-KR')}원 · {order.quantity}권</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                      order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      order.status === 'paid' ? 'bg-cc-accent/10 text-cc-accent border border-cc-accent/20' :
                      'bg-white/5 text-cc-muted border border-white/10'
                    }`}>
                      {order.status === 'delivered' ? '배송완료' :
                       order.status === 'shipped' ? '배송중' :
                       order.status === 'preparing' ? '발송준비' :
                       order.status === 'paid' ? '결제완료' : '처리중'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
