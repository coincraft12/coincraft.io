import { pgTable, uuid, varchar, text, integer, boolean, numeric, timestamp, date } from 'drizzle-orm/pg-core';
import { courses } from './courses';

export const certExams = pgTable('cert_exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 300 }).notNull(),
  level: varchar('level', { length: 20 }).notNull(),
  description: text('description'),
  passingScore: integer('passing_score').notNull().default(70),
  timeLimit: integer('time_limit').notNull().default(60),
  isActive: boolean('is_active').notNull().default(false),
  prerequisiteCourseId: uuid('prerequisite_course_id').references(() => courses.id),
  examFee: numeric('exam_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  maxCapacity: integer('max_capacity'),
  pdfDeliveryDate: date('pdf_delivery_date'),
  pdfFileUrl: text('pdf_file_url'),
  // 시험 일정
  examDate: date('exam_date'),
  registrationStart: timestamp('registration_start', { withTimezone: true }),
  registrationEnd: timestamp('registration_end', { withTimezone: true }),
  examRound: integer('exam_round').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
