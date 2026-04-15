import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { certExams } from './cert-exams';
import { payments } from './payments';

export const examRegistrations = pgTable('exam_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  examId: uuid('exam_id').notNull().references(() => certExams.id),
  paymentId: uuid('payment_id').references(() => payments.id),
  registrationNumber: varchar('registration_number', { length: 30 }).notNull().unique(),
  applicantName: varchar('applicant_name', { length: 100 }),
  applicantBirthdate: varchar('applicant_birthdate', { length: 8 }),
  registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('exam_registrations_user_idx').on(table.userId),
  examIdx: index('exam_registrations_exam_idx').on(table.examId),
  regNumIdx: index('exam_registrations_reg_num_idx').on(table.registrationNumber),
}));
