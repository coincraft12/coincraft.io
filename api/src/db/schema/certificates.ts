import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';

export const certificates = pgTable('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  courseId: uuid('course_id').references(() => courses.id),
  examId: uuid('exam_id'),
  level: varchar('level', { length: 20 }).notNull(),
  certNumber: varchar('cert_number', { length: 50 }).notNull().unique(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  pdfUrl: text('pdf_url'),
  nftTokenId: varchar('nft_token_id', { length: 100 }),
  nftTxHash: varchar('nft_tx_hash', { length: 100 }),
  nftChain: varchar('nft_chain', { length: 20 }),
}, (table) => ({
  userIdx: index('certificates_user_idx').on(table.userId),
  certNumberIdx: index('certificates_cert_number_idx').on(table.certNumber),
}));
