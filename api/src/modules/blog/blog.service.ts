import { eq, and, ilike, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { posts, categories, postCategories, tags, postTags, users } from '../../db/schema';
import type { BlogQuery, CreatePostInput, UpdatePostInput } from './blog.schema';

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

export interface PaginatedPosts {
  data: PostListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

async function attachRelations(postIds: string[]): Promise<{
  categoriesByPost: Map<string, { id: string; name: string; slug: string }[]>;
  tagsByPost: Map<string, { id: string; name: string; slug: string }[]>;
}> {
  const categoriesByPost = new Map<string, { id: string; name: string; slug: string }[]>();
  const tagsByPost = new Map<string, { id: string; name: string; slug: string }[]>();

  if (postIds.length === 0) return { categoriesByPost, tagsByPost };

  const catRows = await db
    .select({
      postId: postCategories.postId,
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(inArray(postCategories.postId, postIds));

  const tagRows = await db
    .select({
      postId: postTags.postId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  for (const row of catRows) {
    const arr = categoriesByPost.get(row.postId) ?? [];
    arr.push({ id: row.id, name: row.name, slug: row.slug });
    categoriesByPost.set(row.postId, arr);
  }

  for (const row of tagRows) {
    const arr = tagsByPost.get(row.postId) ?? [];
    arr.push({ id: row.id, name: row.name, slug: row.slug });
    tagsByPost.set(row.postId, arr);
  }

  return { categoriesByPost, tagsByPost };
}

export async function listPosts(query: BlogQuery): Promise<PaginatedPosts> {
  const { category, tag, q, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(posts.status, 'published')];
  if (q) conditions.push(ilike(posts.title, `%${q}%`));

  // Category filter via subquery
  let categoryFilterIds: string[] | null = null;
  if (category) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);
    if (cat) {
      const pcRows = await db
        .select({ postId: postCategories.postId })
        .from(postCategories)
        .where(eq(postCategories.categoryId, cat.id));
      categoryFilterIds = pcRows.map((r) => r.postId);
      if (categoryFilterIds.length === 0) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
    } else {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  }

  // Tag filter via subquery
  let tagFilterIds: string[] | null = null;
  if (tag) {
    const [t] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, tag))
      .limit(1);
    if (t) {
      const ptRows = await db
        .select({ postId: postTags.postId })
        .from(postTags)
        .where(eq(postTags.tagId, t.id));
      tagFilterIds = ptRows.map((r) => r.postId);
      if (tagFilterIds.length === 0) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
    } else {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  }

  if (categoryFilterIds) conditions.push(inArray(posts.id, categoryFilterIds));
  if (tagFilterIds) conditions.push(inArray(posts.id, tagFilterIds));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(...conditions));

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      status: posts.status,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);

  const postIds = rows.map((r) => r.id);
  const { categoriesByPost, tagsByPost } = await attachRelations(postIds);

  const data: PostListItem[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    coverImage: r.coverImage,
    status: r.status,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    author: r.authorId
      ? { id: r.authorId, name: r.authorName ?? '', avatarUrl: r.authorAvatar ?? null }
      : null,
    categories: categoriesByPost.get(r.id) ?? [],
    tags: tagsByPost.get(r.id) ?? [],
  }));

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getPostBySlug(slug: string): Promise<PostDetail> {
  const [post] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      content: posts.content,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      status: posts.status,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, 'published')))
    .limit(1);

  if (!post) throw Object.assign(new Error('포스트를 찾을 수 없습니다.'), { code: 'NOT_FOUND', status: 404 });

  const { categoriesByPost, tagsByPost } = await attachRelations([post.id]);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    author: post.authorId
      ? { id: post.authorId, name: post.authorName ?? '', avatarUrl: post.authorAvatar ?? null }
      : null,
    categories: categoriesByPost.get(post.id) ?? [],
    tags: tagsByPost.get(post.id) ?? [],
  };
}

export async function createPost(input: CreatePostInput, authorId: string): Promise<PostDetail> {
  const { categoryIds, tagIds, publishedAt, ...rest } = input;

  const [created] = await db
    .insert(posts)
    .values({
      ...rest,
      authorId,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    })
    .returning();

  if (categoryIds && categoryIds.length > 0) {
    await db.insert(postCategories).values(
      categoryIds.map((categoryId) => ({ postId: created.id, categoryId }))
    );
  }

  if (tagIds && tagIds.length > 0) {
    await db.insert(postTags).values(
      tagIds.map((tagId) => ({ postId: created.id, tagId }))
    );
  }

  return getPostBySlug(created.slug);
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<PostDetail> {
  const { categoryIds, tagIds, publishedAt, ...rest } = input;

  const updateData: Record<string, unknown> = {
    ...rest,
    updatedAt: new Date(),
  };
  if (publishedAt !== undefined) {
    updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
  }

  const [updated] = await db
    .update(posts)
    .set(updateData)
    .where(eq(posts.id, id))
    .returning();

  if (!updated) throw Object.assign(new Error('포스트를 찾을 수 없습니다.'), { code: 'NOT_FOUND', status: 404 });

  if (categoryIds !== undefined) {
    await db.delete(postCategories).where(eq(postCategories.postId, id));
    if (categoryIds.length > 0) {
      await db.insert(postCategories).values(
        categoryIds.map((categoryId) => ({ postId: id, categoryId }))
      );
    }
  }

  if (tagIds !== undefined) {
    await db.delete(postTags).where(eq(postTags.postId, id));
    if (tagIds.length > 0) {
      await db.insert(postTags).values(
        tagIds.map((tagId) => ({ postId: id, tagId }))
      );
    }
  }

  // Return even if draft
  const [post] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      content: posts.content,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      status: posts.status,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1);

  const { categoriesByPost, tagsByPost } = await attachRelations([id]);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    author: post.authorId
      ? { id: post.authorId, name: post.authorName ?? '', avatarUrl: post.authorAvatar ?? null }
      : null,
    categories: categoriesByPost.get(post.id) ?? [],
    tags: tagsByPost.get(post.id) ?? [],
  };
}

export async function deletePost(id: string): Promise<void> {
  const [deleted] = await db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
  if (!deleted) throw Object.assign(new Error('포스트를 찾을 수 없습니다.'), { code: 'NOT_FOUND', status: 404 });
}

export async function listCategories(): Promise<{ id: string; name: string; slug: string }[]> {
  return db.select().from(categories).orderBy(categories.name);
}

export async function listTags(): Promise<{ id: string; name: string; slug: string }[]> {
  return db.select().from(tags).orderBy(tags.name);
}
