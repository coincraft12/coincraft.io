'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';

interface WishlistButtonProps {
  courseId: string;
}

export default function WishlistButton({ courseId }: WishlistButtonProps) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !token) return;
    apiClient
      .get<{ success: boolean; data: { wishlisted: boolean } }>(
        `/api/v1/courses/${courseId}/wishlist/status`,
        { token }
      )
      .then((res) => setWishlisted(res.data.wishlisted))
      .catch(() => {});
  }, [token, isAuthLoading, courseId]);

  const handleToggle = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: { wishlisted: boolean } }>(
        `/api/v1/courses/${courseId}/wishlist`,
        undefined,
        { token }
      );
      setWishlisted(res.data.wishlisted);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading || !token) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-cc border text-sm font-medium transition-colors ${
        wishlisted
          ? 'border-cc-accent/50 text-cc-accent bg-cc-accent/10 hover:bg-cc-accent/20'
          : 'border-white/20 text-cc-muted hover:text-cc-text hover:border-white/40'
      }`}
    >
      <span>{wishlisted ? '♥' : '♡'}</span>
      <span>{wishlisted ? '위시리스트 저장됨' : '위시리스트에 저장'}</span>
    </button>
  );
}
