import { z } from 'zod';

export const progressSchema = z.object({
  watchedSeconds: z.number().int().min(0),
});

export const enrollSchema = z.object({});

export type ProgressDto = z.infer<typeof progressSchema>;
export type EnrollDto = z.infer<typeof enrollSchema>;
