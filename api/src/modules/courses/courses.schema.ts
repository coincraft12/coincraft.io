import { z } from 'zod';

export const coursesQuerySchema = z.object({
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  isFree: z.coerce.boolean().optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(['newest', 'popular', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type CoursesQuery = z.infer<typeof coursesQuerySchema>;
