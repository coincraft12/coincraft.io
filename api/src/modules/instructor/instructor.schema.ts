import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  thumbnailUrl: z.string().min(1).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  category: z.string().max(50).optional(),
  originalPrice: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(false),
}).refine(
  (d) => !d.originalPrice || d.originalPrice === 0 || d.price <= d.originalPrice,
  { message: '판매가는 정가보다 클 수 없습니다.', path: ['price'] }
);

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  thumbnailUrl: z.string().min(1).optional().nullable(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  category: z.string().max(50).optional().nullable(),
  originalPrice: z.coerce.number().min(0).optional().nullable(),
  price: z.coerce.number().min(0).optional(),
  isFree: z.boolean().optional(),
  isPublished: z.boolean().optional(),
}).refine(
  (d) => {
    if (d.price == null || !d.originalPrice || d.originalPrice === 0) return true;
    return d.price <= d.originalPrice;
  },
  { message: '판매가는 정가보다 클 수 없습니다.', path: ['price'] }
);

export const createChapterSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  order: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

export const createLessonSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum(['video', 'text', 'quiz']).default('video'),
  videoProvider: z.enum(['youtube', 'vimeo']).optional(),
  videoUrl: z.string().optional(),
  duration: z.coerce.number().int().min(0).default(0),
  isPreview: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  textContent: z.string().optional(),
  order: z.coerce.number().int().min(0).default(0),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  type: z.enum(['video', 'text', 'quiz']).optional(),
  videoProvider: z.enum(['youtube', 'vimeo']).optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  duration: z.coerce.number().int().min(0).optional(),
  isPreview: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  textContent: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).optional(),
  chapterId: z.string().uuid().optional(),
});

export const updateChapterSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
