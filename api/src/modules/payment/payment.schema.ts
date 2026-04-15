import { z } from 'zod';

export const preparePaymentSchema = z.object({
  courseId: z.string().uuid(),
});

export const confirmPaymentSchema = z.object({
  impUid: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
});

export const prepareEbookPaymentSchema = z.object({
  ebookId: z.string().uuid(),
});

export const confirmEbookPaymentSchema = z.object({
  impUid: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
});

export const prepareExamPaymentSchema = z.object({
  examId: z.string().uuid(),
});

export const confirmExamPaymentSchema = z.object({
  impUid: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
});

export const prepareSubscriptionPaymentSchema = z.object({
  plan: z.enum(['basic-monthly', 'basic-yearly']),
});

export const confirmSubscriptionPaymentSchema = z.object({
  impUid: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
});

export type PreparePaymentDto = z.infer<typeof preparePaymentSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
export type PrepareEbookPaymentDto = z.infer<typeof prepareEbookPaymentSchema>;
export type ConfirmEbookPaymentDto = z.infer<typeof confirmEbookPaymentSchema>;
export type PrepareExamPaymentDto = z.infer<typeof prepareExamPaymentSchema>;
export type ConfirmExamPaymentDto = z.infer<typeof confirmExamPaymentSchema>;
export type PrepareSubscriptionPaymentDto = z.infer<typeof prepareSubscriptionPaymentSchema>;
export type ConfirmSubscriptionPaymentDto = z.infer<typeof confirmSubscriptionPaymentSchema>;

