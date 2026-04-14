const API_BASE = typeof window === 'undefined'
  ? (process.env.API_INTERNAL_URL ?? 'http://localhost:4001')
  : (process.env.NEXT_PUBLIC_API_URL ?? '');

interface ApiOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Refresh token 관리 ────────────────────────────────────────────────────────
const TOKEN_KEY = 'cc_access_token';

let isRefreshing = false;
let refreshWaiters: Array<(token: string | null) => void> = [];

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const body = await res.json();
    return (body as any).data?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    // 이미 갱신 중이면 완료될 때까지 대기
    return new Promise((resolve) => { refreshWaiters.push(resolve); });
  }

  isRefreshing = true;
  const newToken = await doRefresh();

  if (newToken && typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, newToken);
    document.cookie = `cc_token=${newToken}; path=/; max-age=${60 * 60}; SameSite=Lax`;
    // Zustand store 업데이트 (동적 import로 순환 참조 방지)
    import('@/store/auth.store').then(({ useAuthStore }) => {
      useAuthStore.getState().setToken(newToken);
    });
  } else if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = 'cc_token=; path=/; max-age=0';
    import('@/store/auth.store').then(({ useAuthStore }) => {
      useAuthStore.getState().logout();
    });
  }

  // 대기 중인 요청들에게 결과 전달
  refreshWaiters.forEach((resolve) => resolve(newToken));
  refreshWaiters = [];
  isRefreshing = false;

  return newToken;
}

// ── 핵심 요청 함수 ────────────────────────────────────────────────────────────
async function request<T>(path: string, options: ApiOptions = {}, _isRetry = false): Promise<T> {
  const { token, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });

  // 401 → 토큰 갱신 후 1회 재시도
  if (res.status === 401 && token && !_isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, { ...options, token: newToken }, true);
    }
    // 갱신 실패 → 그냥 401 throw
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: res.statusText } }));
    throw new ApiError(res.status, body.error?.code ?? 'UNKNOWN', body.error?.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export { ApiError };
