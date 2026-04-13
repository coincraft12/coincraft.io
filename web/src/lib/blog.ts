const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4001';

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null } | null;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
}

export interface PostDetail extends PostListItem {
  content: string | null;
}

export interface BlogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export async function fetchPosts(params: Record<string, string> = {}): Promise<{ data: PostListItem[]; meta: BlogMeta }> {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}/api/v1/blog/posts${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  return res.json();
}

export async function fetchPostBySlug(slug: string): Promise<PostDetail | null> {
  const res = await fetch(`${API_BASE}/api/v1/blog/posts/${slug}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/api/v1/blog/categories`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(`${API_BASE}/api/v1/blog/tags`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}
