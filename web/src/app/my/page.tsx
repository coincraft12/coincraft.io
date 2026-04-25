'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const INTEREST_OPTIONS = [
  '비트코인', '이더리움', '디파이', 'NFT', '온체인 분석', '트레이딩',
  '블록체인 개발', 'Web3', '스테이킹', '레이어2', '크립토 법규', '투자 전략',
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

interface Stats {
  enrolledCount: number;
  completedLessons: number;
}

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  useEffect(() => {
    if (user && !editMode) {
      setName(user.name ?? '');
      setBio(user.bio ?? '');
      setInterests(user.interests ?? []);
      setGithub(user.socialLinks?.github ?? '');
      setTwitter(user.socialLinks?.twitter ?? '');
      setWebsite(user.socialLinks?.website ?? '');
    }
  }, [user, editMode]);

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

  const { data: stats } = useQuery<Stats>({
    queryKey: ['my-stats'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Stats }>(
        '/api/v1/auth/me/stats',
        { token: token ?? undefined }
      );
      return res.data;
    },
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<{ success: boolean; data: typeof user }>(
        '/api/v1/auth/me/profile',
        {
          name: name.trim() || undefined,
          bio: bio || null,
          interests: interests.length > 0 ? interests : null,
          socialLinks: (github || twitter || website)
            ? { github: github || undefined, twitter: twitter || undefined, website: website || undefined }
            : null,
        },
        { token: token ?? undefined }
      );
      return res.data;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) setUser(updatedUser as any);
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      setEditMode(false);
      setSaveMsg('저장되었습니다.');
      setTimeout(() => setSaveMsg(''), 3000);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/v1/instructor/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      return json.data?.url as string;
    },
    onSuccess: async (url) => {
      const res = await apiClient.patch<{ success: boolean; data: typeof user }>(
        '/api/v1/auth/me/profile',
        { avatarUrl: url },
        { token: token ?? undefined }
      );
      if (res.data) setUser(res.data as any);
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-cc-primary flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const connectedAccounts = [
    { key: 'google', label: 'Google', connected: !!user.googleId },
    { key: 'kakao', label: 'Kakao', connected: !!user.kakaoId },
    { key: 'naver', label: 'Naver', connected: !!user.naverId },
    { key: 'wallet', label: '지갑', connected: !!user.walletAddress },
  ].filter((a) => a.connected);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container space-y-10">
          <p className="cc-label">MY PAGE</p>

          {/* 프로필 카드 */}
          <div className="cc-glass border border-white/10 rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* 아바타 */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <div
                  className="relative w-24 h-24 rounded-full overflow-hidden bg-white/10 cursor-pointer group"
                  onClick={() => avatarInputRef.current?.click()}
                  title="프로필 사진 변경"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs">변경</span>
                  </div>
                  {uploadAvatarMutation.isPending && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatarMutation.mutate(file);
                    e.target.value = '';
                  }}
                />
                {connectedAccounts.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap justify-center">
                    {connectedAccounts.map((a) => (
                      <span key={a.key} className="text-xs px-2 py-0.5 rounded-full bg-cc-accent/10 border border-cc-accent/20 text-cc-accent">
                        {a.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 프로필 정보 */}
              <div className="flex-1 min-w-0">
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-cc-muted mb-1 block">이름</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-cc-text text-sm focus:outline-none focus:border-cc-accent/40"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-cc-muted mb-1 block">소개 <span className="opacity-50">({bio.length}/500)</span></label>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-cc-text text-sm focus:outline-none focus:border-cc-accent/40 resize-none"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 500))}
                        rows={3}
                        placeholder="나를 간단히 소개해 보세요."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-cc-muted mb-2 block">관심 분야</label>
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleInterest(tag)}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                              interests.includes(tag)
                                ? 'bg-cc-accent/20 border-cc-accent text-cc-accent'
                                : 'bg-white/5 border-white/10 text-cc-muted hover:border-white/30'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-cc-muted mb-1 block">GitHub</label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-cc-text text-sm focus:outline-none focus:border-cc-accent/40"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="github.com/username"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-cc-muted mb-1 block">Twitter / X</label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-cc-text text-sm focus:outline-none focus:border-cc-accent/40"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-cc-muted mb-1 block">웹사이트</label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-cc-text text-sm focus:outline-none focus:border-cc-accent/40"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending}
                        className="cc-btn-primary text-sm px-5 py-2 disabled:opacity-50"
                      >
                        {updateMutation.isPending ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="text-sm text-cc-muted hover:text-cc-text transition-colors"
                      >
                        취소
                      </button>
                      {updateMutation.isError && (
                        <p className="text-red-400 text-xs">저장 실패</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h1 className="text-2xl font-bold text-cc-text">{user.name}</h1>
                        <p className="text-cc-muted text-sm mt-0.5">{user.email}</p>
                      </div>
                      <button
                        onClick={() => setEditMode(true)}
                        className="text-xs text-cc-muted hover:text-cc-accent transition-colors border border-white/10 hover:border-cc-accent/30 px-3 py-1.5 rounded-lg flex-shrink-0"
                      >
                        프로필 편집
                      </button>
                    </div>
                    {user.bio && (
                      <p className="text-cc-muted text-sm mt-3 leading-relaxed">{user.bio}</p>
                    )}
                    {user.interests && user.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {user.interests.map((tag) => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-cc-accent/10 border border-cc-accent/20 text-cc-accent">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {(user.socialLinks?.github || user.socialLinks?.twitter || user.socialLinks?.website) && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {user.socialLinks.github && (
                          <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-xs text-cc-muted hover:text-cc-accent transition-colors">
                            GitHub ↗
                          </a>
                        )}
                        {user.socialLinks.twitter && (
                          <a href={`https://twitter.com/${user.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cc-muted hover:text-cc-accent transition-colors">
                            Twitter ↗
                          </a>
                        )}
                        {user.socialLinks.website && (
                          <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-xs text-cc-muted hover:text-cc-accent transition-colors">
                            웹사이트 ↗
                          </a>
                        )}
                      </div>
                    )}
                    {saveMsg && (
                      <p className="text-green-400 text-xs mt-2">{saveMsg}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 학습 통계 */}
            {stats && (
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-cc-accent">{stats.enrolledCount}</p>
                  <p className="text-xs text-cc-muted mt-0.5">수강 중인 강좌</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cc-accent">{stats.completedLessons}</p>
                  <p className="text-xs text-cc-muted mt-0.5">완료한 레슨</p>
                </div>
                <div className="text-center col-span-2 sm:col-span-1">
                  <p className="text-2xl font-bold text-cc-accent capitalize">{user.role}</p>
                  <p className="text-xs text-cc-muted mt-0.5">계정 등급</p>
                </div>
              </div>
            )}
          </div>

          {/* 빠른 메뉴 */}
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
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full aspect-video object-cover" />
                    ) : (
                      <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                        <span className="text-3xl">🎓</span>
                      </div>
                    )}
                    <div className="p-4 space-y-1">
                      <h3 className="text-cc-text font-semibold text-sm leading-snug line-clamp-2">{item.title}</h3>
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
