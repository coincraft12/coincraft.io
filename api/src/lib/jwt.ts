import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  role?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

function base64url(data: Buffer | string): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return buf.toString('base64url');
}

function parseExpiry(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return parseInt(match[1]) * multipliers[match[2]];
}

function sign(payload: object, secret: string, expiresIn: string): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + parseExpiry(expiresIn) };
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(fullPayload));
  const sig = base64url(createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

function verify(token: string, secret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const [header, body, sig] = parts;
  const expectedBuf = createHmac('sha256', secret).update(`${header}.${body}`).digest();
  const sigBuf = Buffer.from(sig, 'base64url');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Invalid JWT signature');
  }
  const payload: JwtPayload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('JWT expired');
  return payload;
}

export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return sign(payload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
}

export function generateRefreshToken(userId: string): string {
  return sign({ sub: userId }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);
}

export function verifyAccessToken(token: string): JwtPayload {
  return verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verify(token, env.JWT_REFRESH_SECRET);
}
