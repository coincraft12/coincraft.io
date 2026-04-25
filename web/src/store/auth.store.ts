import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'student' | 'instructor' | 'admin';
  emailVerified: boolean;
  bio?: string | null;
  interests?: string[] | null;
  socialLinks?: { github?: string; twitter?: string; website?: string } | null;
  googleId?: string | null;
  kakaoId?: string | null;
  naverId?: string | null;
  walletAddress?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setToken: (accessToken) => set({ accessToken }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, accessToken: null }),
}));
