import { env } from '../config/env';

const TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const USERINFO_URL = 'https://kapi.kakao.com/v2/user/me';
const AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';

export interface KakaoUser {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

export function getKakaoAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.KAKAO_REST_API_KEY!,
    redirect_uri: env.KAKAO_REDIRECT_URI!,
    response_type: 'code',
    scope: 'profile_nickname,profile_image',
    state,
  });
  return `${AUTH_URL}?${params}`;
}

export async function exchangeKakaoCode(code: string): Promise<KakaoUser> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.KAKAO_REST_API_KEY!,
      client_secret: env.KAKAO_CLIENT_SECRET ?? '',
      redirect_uri: env.KAKAO_REDIRECT_URI!,
      code,
    }),
  });
  if (!tokenRes.ok) throw new Error('Kakao token exchange failed');
  const { access_token } = await tokenRes.json() as { access_token: string };

  const userRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) throw new Error('Failed to fetch Kakao user info');
  return userRes.json() as Promise<KakaoUser>;
}
