import { z } from 'zod';

export const startExamSchema = z.object({
  examId: z.string().uuid(),
});

export const submitExamSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0)),
});

export const mintSchema = z.object({
  walletAddress: z.string().min(1),
});

export const createExamSchema = z.object({
  title: z.string().min(1).max(300),
  level: z.enum(['basic', 'associate', 'expert']),
  description: z.string().optional(),
  passingScore: z.number().int().min(1).max(100).default(70),
  timeLimit: z.number().int().min(1).default(60),
  isActive: z.boolean().default(false),
  prerequisiteCourseId: z.string().uuid().optional(),
  examFee: z.number().min(0).default(0),
  maxCapacity: z.number().int().min(1).optional(),
  pdfDeliveryDate: z.string().optional(),
  pdfFileUrl: z.string().url().optional(),
  // 시험 일정
  examDate: z.string().optional(),                                         // YYYY-MM-DD
  registrationStart: z.string().datetime({ offset: true }).optional(),
  registrationEnd: z.string().datetime({ offset: true }).optional(),
  examRound: z.number().int().min(1).default(1),
});

export const updateExamSchema = createExamSchema.partial();

export const refundRegistrationSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const addQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
  order: z.number().int().min(0).default(0),
  points: z.number().int().min(1).default(1),
});

export const bulkImportQuestionsSchema = z.object({
  questions: z.array(addQuestionSchema),
});

export type StartExamDto = z.infer<typeof startExamSchema>;
export type SubmitExamDto = z.infer<typeof submitExamSchema>;
export type MintDto = z.infer<typeof mintSchema>;
export type CreateExamDto = z.infer<typeof createExamSchema>;
export type UpdateExamDto = z.infer<typeof updateExamSchema>;
export type RefundRegistrationDto = z.infer<typeof refundRegistrationSchema>;
export type AddQuestionDto = z.infer<typeof addQuestionSchema>;
export type BulkImportQuestionsDto = z.infer<typeof bulkImportQuestionsSchema>;
