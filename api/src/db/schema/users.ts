import { pgTable, uuid, varchar, boolean, timestamp, text, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 20 }).notNull().default('student'),
  googleId: varchar('google_id', { length: 100 }),
  kakaoId: varchar('kakao_id', { length: 100 }),
  naverId: varchar('naver_id', { length: 100 }),
  walletAddress: varchar('wallet_address', { length: 42 }),
  expoPushToken: text('expo_push_token'),
  emailVerified: boolean('email_verified').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  googleIdIdx: index('users_google_id_idx').on(table.googleId),
  kakaoIdIdx: index('users_kakao_id_idx').on(table.kakaoId),
  walletIdx: index('users_wallet_idx').on(table.walletAddress),
}));
