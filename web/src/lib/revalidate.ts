export async function revalidateCourse(slug?: string) {
  const paths = ['/courses'];
  if (slug) paths.push(`/courses/${slug}`);

  await fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  }).catch(() => {});
}
