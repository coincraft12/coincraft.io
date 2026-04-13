export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[가-힣]+/g, '') // strip Korean (manually set Korean slugs)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
