import { z } from 'zod';

export const preparePaymentSchema = z.object({
  courseId: z.string().uuid(),
});

export const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
});

export type PreparePaymentDto = z.infer<typeof preparePaymentSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
