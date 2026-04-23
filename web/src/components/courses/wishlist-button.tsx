'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';
import { getLocalWL, saveLocalWL, toggleLocalWL } from '@/lib/local-wishlist';

export default function WishlistButton({ courseId, isEnrolled }: { courseId: string; isEnrolled?: boolean }) {
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

    // 로그인됨 — 로컬 캐시 동기화
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

  const handleToggle = async () => {
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

  if (isEnrolled) return null;

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
