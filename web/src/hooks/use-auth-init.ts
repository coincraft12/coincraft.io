'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiError } from '@/lib/api-client';

const TOKEN_KEY = 'cc_access_token';

export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `cc_token=${token}; path=/; max-age=${60 * 60}; SameSite=Lax`;
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = 'cc_token=; path=/; max-age=0';
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function useAuthInit() {
  const { setUser, setToken, setLoading } = useAuthStore();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setToken(token);
    apiClient
      .get<{ data: any }>('/api/v1/auth/me', { token })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        // 401 → 토큰 만료, 로그아웃 처리
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          setToken(null);
        }
      })
      .finally(() => setLoading(false));
  }, [setUser, setToken, setLoading]);
}
