'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateCourse(slug?: string) {
  revalidatePath('/courses');
  if (slug) revalidatePath(`/courses/${slug}`);
}
