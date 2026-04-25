import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import { db } from '../../db';
import { users } from '../../db/schema';
import { redis } from '../../lib/redis';
import { hashPassword, verifyPassword } from '../../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendJoinEmail } from '../../lib/email';
import { notifyJoin } from '../../lib/notifications';
import { getGoogleAuthUrl, exchangeGoogleCode } from '../../lib/google-oauth';
import { getKakaoAuthUrl, exchangeKakaoCode } from '../../lib/kakao-oauth';
import { generateId } from '../../utils/uuid';
import type { RegisterDto, LoginDto } from './auth.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  bio: string | null;
  interests: string[] | null;
  socialLinks: { github?: string; twitter?: string; website?: string } | null;
  googleId: string | null;
  kakaoId: string | null;
  naverId: string | null;
  walletAddress: string | null;
}

// ─── Redis key helpers ────────────────────────────────────────────────────────

const REFRESH_KEY = (token: string) => `refresh:${token}`;
const VERIFY_KEY = (token: string) => `verify:${token}`;
const RESET_KEY = (token: string) => `reset:${token}`;
const RESEND_KEY = (email: string) => `resend:${email}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSafeUser(user: typeof users.$inferSelect): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    bio: user.bio ?? null,
    interests: user.interests ?? null,
    socialLinks: (user.socialLinks as SafeUser['socialLinks']) ?? null,
    googleId: user.googleId ?? null,
    kakaoId: user.kakaoId ?? null,
    naverId: user.naverId ?? null,
    walletAddress: user.walletAddress ?? null,
  };
}

function issueTokens(user: SafeUser): AuthTokens {
  const accessToken = generateAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken(user.id);
  return { accessToken, refreshToken };
}

async function storeRefreshToken(refreshToken: string, userId: string): Promise<void> {
  // 30d TTL
  await redis.set(REFRESH_KEY(refreshToken), userId, 'EX', 30 * 24 * 3600);
}

// ─── Email Auth ───────────────────────────────────────────────────────────────

export async function register(dto: RegisterDto): Promise<SafeUser> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, dto.email)).limit(1);
  if (existing.length > 0) throw Object.assign(new Error('이미 사용 중인 이메일입니다.'), { code: 'EMAIL_TAKEN', status: 409 });

  const passwordHash = await hashPassword(dto.password);
  const [user] = await db.insert(users).values({
    email: dto.email,
    passwordHash,
    name: dto.name,
    phone: dto.phone ?? null,
  }).returning();

  // 이메일 인증 토큰 발급
  const token = generateId();
  await redis.set(VERIFY_KEY(token), user.id, 'EX', 24 * 3600);
  await sendVerificationEmail(user.email, token).catch((e) => console.error('sendVerificationEmail error:', e));
  if (user.phone) notifyJoin(user.phone, user.name).catch(() => {});
  sendJoinEmail(user.email, user.name).catch(() => {});

  return toSafeUser(user);
}

export async function verifyEmail(token: string): Promise<void> {
  const userId = await redis.get(VERIFY_KEY(token));
  if (!userId) throw Object.assign(new Error('유효하지 않거나 만료된 인증 링크입니다.'), { code: 'INVALID_TOKEN', status: 400 });

  await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
  await redis.del(VERIFY_KEY(token));
}

export async function resendVerification(email: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return; // silent — don't reveal email existence
  if (user.emailVerified) throw Object.assign(new Error('이미 인증된 이메일입니다.'), { code: 'ALREADY_VERIFIED', status: 400 });

  const resendCount = await redis.incr(RESEND_KEY(email));
  if (resendCount === 1) await redis.expire(RESEND_KEY(email), 3600);
  if (resendCount > 3) throw Object.assign(new Error('재발송 횟수를 초과했습니다. 1시간 후 다시 시도해 주세요.'), { code: 'TOO_MANY_REQUESTS', status: 429 });

  const token = generateId();
  await redis.set(VERIFY_KEY(token), user.id, 'EX', 24 * 3600);
  await sendVerificationEmail(user.email, token);
}

export async function login(dto: LoginDto): Promise<AuthTokens & { user: SafeUser }> {
  const [user] = await db.select().from(users).where(eq(users.email, dto.email)).limit(1);
  if (!user || !user.passwordHash) {
    throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS', status: 401 });
  }
  if (!user.isActive) {
    throw Object.assign(new Error('비활성화된 계정입니다.'), { code: 'ACCOUNT_INACTIVE', status: 403 });
  }

  const valid = await verifyPassword(dto.password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS', status: 401 });

  const safeUser = toSafeUser(user);
  const tokens = issueTokens(safeUser);
  await storeRefreshToken(tokens.refreshToken, user.id);
  return { ...tokens, user: safeUser };
}

export async function refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
  // 검증 (만료/서명)
  verifyRefreshToken(oldRefreshToken);

  const userId = await redis.get(REFRESH_KEY(oldRefreshToken));
  if (!userId) throw Object.assign(new Error('유효하지 않은 토큰입니다.'), { code: 'INVALID_TOKEN', status: 401 });

  // Rotation: 기존 토큰 즉시 삭제
  await redis.del(REFRESH_KEY(oldRefreshToken));

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive) throw Object.assign(new Error('계정을 찾을 수 없습니다.'), { code: 'USER_NOT_FOUND', status: 401 });

  const safeUser = toSafeUser(user);
  const tokens = issueTokens(safeUser);
  await storeRefreshToken(tokens.refreshToken, user.id);
  return tokens;
}

export async function logout(refreshToken: string): Promise<void> {
  await redis.del(REFRESH_KEY(refreshToken));
}

export async function getMe(userId: string): Promise<SafeUser> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw Object.assign(new Error('사용자를 찾을 수 없습니다.'), { code: 'USER_NOT_FOUND', status: 404 });
  return toSafeUser(user);
}

export async function forgotPassword(email: string): Promise<void> {
  const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) return; // silent

  const token = generateId();
  await redis.set(RESET_KEY(token), user.id, 'EX', 15 * 60); // 15분
  await sendPasswordResetEmail(user.email, token).catch((e) => console.error('sendPasswordResetEmail error:', e));
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const userId = await redis.get(RESET_KEY(token));
  if (!userId) throw Object.assign(new Error('유효하지 않거나 만료된 링크입니다.'), { code: 'INVALID_TOKEN', status: 400 });

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  await redis.del(RESET_KEY(token));
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function getGoogleUrl(state: string): Promise<string> {
  return getGoogleAuthUrl(state);
}

export async function handleGoogleCallback(code: string): Promise<AuthTokens & { user: SafeUser }> {
  const googleUser = await exchangeGoogleCode(code);
  if (!googleUser.email) throw Object.assign(new Error('Google 계정에서 이메일을 가져올 수 없습니다.'), { code: 'OAUTH_ERROR', status: 400 });

  // upsert: google_id 기준
  let [user] = await db.select().from(users).where(eq(users.googleId, googleUser.id)).limit(1);

  if (!user) {
    // 동일 이메일 계정 있으면 google_id 연결
    [user] = await db.select().from(users).where(eq(users.email, googleUser.email)).limit(1);
    if (user) {
      [user] = await db.update(users).set({ googleId: googleUser.id }).where(eq(users.id, user.id)).returning();
    } else {
      [user] = await db.insert(users).values({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture ?? null,
        googleId: googleUser.id,
        emailVerified: googleUser.verified_email,
      }).returning();
    }
  }

  const safeUser = toSafeUser(user);
  const tokens = issueTokens(safeUser);
  await storeRefreshToken(tokens.refreshToken, user.id);
  return { ...tokens, user: safeUser };
}

// ─── Kakao OAuth ──────────────────────────────────────────────────────────────

export async function getKakaoUrl(state: string): Promise<string> {
  return getKakaoAuthUrl(state);
}

export async function handleKakaoCallback(code: string): Promise<AuthTokens & { user: SafeUser }> {
  const kakaoUser = await exchangeKakaoCode(code);
  const kakaoId = String(kakaoUser.id);
  const email = kakaoUser.kakao_account?.email;
  const name = kakaoUser.kakao_account?.profile?.nickname ?? '사용자';
  const avatarUrl = kakaoUser.kakao_account?.profile?.profile_image_url ?? null;

  // +82 10-1234-5678 → 01012345678
  const rawPhone = kakaoUser.kakao_account?.phone_number;
  const phone = rawPhone
    ? rawPhone.replace(/\D/g, '').replace(/^82/, '0')
    : undefined;

  let [user] = await db.select().from(users).where(eq(users.kakaoId, kakaoId)).limit(1);

  if (!user) {
    if (email) {
      [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (user) {
        [user] = await db.update(users)
          .set({ kakaoId, ...(phone && !user.phone ? { phone } : {}) })
          .where(eq(users.id, user.id))
          .returning();
      }
    }
    if (!user) {
      const emailValue = email ?? `kakao_${kakaoId}@coincraft.io`;
      [user] = await db.insert(users).values({
        email: emailValue,
        name,
        avatarUrl,
        kakaoId,
        phone: phone ?? null,
        emailVerified: !!email,
      }).returning();
    }
  } else if (phone && !user.phone) {
    // 기존 카카오 유저인데 phone이 없으면 업데이트
    [user] = await db.update(users).set({ phone }).where(eq(users.id, user.id)).returning();
  }

  const safeUser = toSafeUser(user);
  const tokens = issueTokens(safeUser);
  await storeRefreshToken(tokens.refreshToken, user.id);
  return { ...tokens, user: safeUser };
}

// ─── Web3 Wallet Auth ─────────────────────────────────────────────────────────

export async function getWeb3Nonce(address: string): Promise<{ nonce: string }> {
  const checksumAddress = ethers.getAddress(address);

  let [user] = await db.select().from(users).where(eq(users.walletAddress, checksumAddress)).limit(1);

  const nonce = randomBytes(32).toString('hex');
  const shortName = `${checksumAddress.slice(0, 6)}...${checksumAddress.slice(-4)}`;

  if (!user) {
    // 신규 사용자 생성 (email nullable 처리: 고유 플레이스홀더 사용)
    const placeholderEmail = `wallet_${checksumAddress.toLowerCase()}@coincraft.io`;
    [user] = await db.insert(users).values({
      walletAddress: checksumAddress,
      walletNonce: nonce,
      name: shortName,
      email: placeholderEmail,
      emailVerified: false,
    }).returning();
  } else {
    await db.update(users).set({ walletNonce: nonce }).where(eq(users.id, user.id));
  }

  return { nonce };
}

export async function verifyWeb3Signature(
  message: string,
  signature: string,
): Promise<AuthTokens & { user: SafeUser }> {
  // message 형식: "CoinCraft에 로그인합니다.\n\n주소: ${address}\nNonce: ${nonce}"
  const addressMatch = message.match(/주소:\s*(0x[0-9a-fA-F]{40})/);
  const nonceMatch = message.match(/Nonce:\s*([0-9a-fA-F]+)/);

  if (!addressMatch || !nonceMatch) {
    throw Object.assign(new Error('유효하지 않은 메시지 형식입니다.'), { code: 'INVALID_MESSAGE', status: 400 });
  }

  const address = addressMatch[1];
  const nonce = nonceMatch[1];

  // 서명자 주소 복원
  let recoveredAddress: string;
  try {
    recoveredAddress = ethers.verifyMessage(message, signature);
  } catch {
    throw Object.assign(new Error('서명 검증에 실패했습니다.'), { code: 'INVALID_SIGNATURE', status: 401 });
  }

  const checksumAddress = ethers.getAddress(address);
  if (recoveredAddress.toLowerCase() !== checksumAddress.toLowerCase()) {
    throw Object.assign(new Error('서명자 주소가 일치하지 않습니다.'), { code: 'SIGNATURE_MISMATCH', status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.walletAddress, checksumAddress)).limit(1);
  if (!user) {
    throw Object.assign(new Error('지갑 주소를 찾을 수 없습니다. 먼저 nonce를 요청해 주세요.'), { code: 'USER_NOT_FOUND', status: 404 });
  }

  if (!user.walletNonce || user.walletNonce !== nonce) {
    throw Object.assign(new Error('Nonce가 유효하지 않습니다.'), { code: 'INVALID_NONCE', status: 401 });
  }

  // nonce 재사용 방지: 즉시 초기화
  await db.update(users).set({ walletNonce: null }).where(eq(users.id, user.id));

  const safeUser = toSafeUser(user);
  const tokens = issueTokens(safeUser);
  await storeRefreshToken(tokens.refreshToken, user.id);
  return { ...tokens, user: safeUser };
}

export interface UpdateProfileDto {
  name?: string;
  bio?: string | null;
  interests?: string[] | null;
  socialLinks?: { github?: string; twitter?: string; website?: string } | null;
  avatarUrl?: string | null;
}

export async function updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  if (dto.name !== undefined) updates.name = dto.name.trim().slice(0, 100) || undefined;
  if (dto.bio !== undefined) updates.bio = dto.bio ? dto.bio.slice(0, 500) : null;
  if (dto.interests !== undefined) updates.interests = dto.interests;
  if (dto.socialLinks !== undefined) updates.socialLinks = dto.socialLinks as any;
  if (dto.avatarUrl !== undefined) updates.avatarUrl = dto.avatarUrl;

  await db.update(users).set(updates).where(eq(users.id, userId));
  return getMe(userId);
}
