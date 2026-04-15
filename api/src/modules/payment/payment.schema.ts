import { z } from 'zod';

export const preparePaymentSchema = z.object({
  courseId: z.string().uuid(),
});

export const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
});

export const prepareEbookPaymentSchema = z.object({
  ebookId: z.string().uuid(),
});

export const confirmEbookPaymentSchema = z.object({
  paymentId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
});

export type PreparePaymentDto = z.infer<typeof preparePaymentSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
export type PrepareEbookPaymentDto = z.infer<typeof prepareEbookPaymentSchema>;
export type ConfirmEbookPaymentDto = z.infer<typeof confirmEbookPaymentSchema>;
