export const ok = <T>(data: T, message?: string) => ({ success: true as const, data, ...(message && { message }) });
export const created = <T>(data: T, message?: string) => ({ success: true as const, data, ...(message && { message }) });
export const paginated = <T>(data: T[], meta: { total: number; page: number; limit: number; totalPages: number }) => ({
  success: true as const,
  data,
  meta,
});
