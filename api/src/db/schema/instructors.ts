import { pgTable, uuid, text, varchar, boolean, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const instructors = pgTable('instructors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  bio: text('bio'),
  career: text('career'),
  profileUrl: text('profile_url'),
  photoUrl: text('photo_url'),
  specialties: text('specialties').array(),
  totalRevenue: numeric('total_revenue', { precision: 12, scale: 2 }).notNull().default('0'),
  revenueSharePercent: integer('revenue_share_percent').notNull().default(70),
  // 암호화 필드 — 평문 저장 금지, AES-256-GCM 암호화 후 저장
  bankAccountEncrypted: text('bank_account_encrypted'),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
