export const ok = <T>(data: T) => ({ success: true as const, data });
export const created = <T>(data: T) => ({ success: true as const, data });
export const paginated = <T>(items: T[], total: number, page: number, limit: number) => ({
  success: true as const,
  data: items,
  pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
});
