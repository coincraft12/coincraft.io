'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import { getLocalWL, saveLocalWL, toggleLocalWL } from '@/lib/local-wishlist';

export default function WishlistHeart({ courseId }: { courseId: string }) {
  const token = useAuthStore((s) => s.accessToken);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!token) {
      setWishlisted(getLocalWL().has(courseId));
      return;
    }

    // 로그인됨 — 로컬 캐시에 있으면 서버 동기화
    const localWL = getLocalWL();
    if (localWL.has(courseId)) {
      localWL.delete(courseId);
      saveLocalWL(localWL);
      apiClient
        .post<{ success: boolean; data: { wishlisted: boolean } }>(
          `/api/v1/courses/${courseId}/wishlist`,
          undefined,
          { token }
        )
        .then((res) => setWishlisted(res.data.wishlisted))
        .catch(() => {});
    } else {
      apiClient
        .get<{ success: boolean; data: { wishlisted: boolean } }>(
          `/api/v1/courses/${courseId}/wishlist/status`,
          { token }
        )
        .then((res) => setWishlisted(res.data.wishlisted))
        .catch(() => {});
    }
  }, [token, isAuthLoading, courseId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (!token) {
      // 비로그인: 로컬에만 저장, UI 즉시 반영
      const next = toggleLocalWL(courseId);
      setWishlisted(next);
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
      //
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-base transition-all z-10 ${
        wishlisted
          ? 'bg-cc-accent/20 text-cc-accent border border-cc-accent/40'
          : 'bg-black/40 text-white/70 border border-white/20 hover:bg-black/60 hover:text-white'
      }`}
      aria-label="위시리스트"
    >
      {wishlisted ? '♥' : '♡'}
    </button>
  );
}
