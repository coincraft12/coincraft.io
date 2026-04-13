import { eq, and, desc } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { db } from '../../db';
import { ebooks, ebookPurchases, ebookReadingProgress } from '../../db/schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EbookMeta {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  price: string;
  isFree: boolean;
  isPublished: boolean;
  pageCount: number | null;
  createdAt: Date;
}

export interface EbookListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  price: string;
  isFree: boolean;
  pageCount: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(message: string, code: string, status: number): Error {
  return Object.assign(new Error(message), { code, status });
}

async function hasAccess(ebookId: string, userId: string): Promise<boolean> {
  // Check if the user has purchased the ebook
  const [purchase] = await db
    .select({ id: ebookPurchases.id })
    .from(ebookPurchases)
    .where(
      and(
        eq(ebookPurchases.userId, userId),
        eq(ebookPurchases.ebookId, ebookId)
      )
    )
    .limit(1);

  return !!purchase;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function listEbooks(): Promise<EbookListItem[]> {
  const rows = await db
    .select({
      id: ebooks.id,
      slug: ebooks.slug,
      title: ebooks.title,
      description: ebooks.description,
      coverImageUrl: ebooks.coverImageUrl,
      price: ebooks.price,
      isFree: ebooks.isFree,
      pageCount: ebooks.pageCount,
    })
    .from(ebooks)
    .where(eq(ebooks.isPublished, true))
    .orderBy(desc(ebooks.createdAt));

  return rows;
}

export async function getEbookMeta(ebookId: string, userId: string): Promise<EbookMeta> {
  const [ebook] = await db
    .select({
      id: ebooks.id,
      slug: ebooks.slug,
      title: ebooks.title,
      description: ebooks.description,
      coverImageUrl: ebooks.coverImageUrl,
      price: ebooks.price,
      isFree: ebooks.isFree,
      isPublished: ebooks.isPublished,
      epubUrl: ebooks.epubUrl,
      pageCount: ebooks.pageCount,
      createdAt: ebooks.createdAt,
    })
    .from(ebooks)
    .where(eq(ebooks.id, ebookId))
    .limit(1);

  if (!ebook || !ebook.isPublished) {
    throw makeError('전자책을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  // Check access: free ebook or purchased
  if (!ebook.isFree) {
    const access = await hasAccess(ebookId, userId);
    if (!access) {
      throw makeError('이 전자책에 접근할 권한이 없습니다.', 'FORBIDDEN', 403);
    }
  }

  return {
    id: ebook.id,
    slug: ebook.slug,
    title: ebook.title,
    description: ebook.description,
    coverImageUrl: ebook.coverImageUrl,
    price: ebook.price,
    isFree: ebook.isFree,
    isPublished: ebook.isPublished,
    pageCount: ebook.pageCount,
    createdAt: ebook.createdAt,
  };
}

export async function getEbookFile(ebookId: string, userId: string): Promise<Buffer> {
  const [ebook] = await db
    .select({
      id: ebooks.id,
      isFree: ebooks.isFree,
      isPublished: ebooks.isPublished,
      epubUrl: ebooks.epubUrl,
    })
    .from(ebooks)
    .where(eq(ebooks.id, ebookId))
    .limit(1);

  if (!ebook || !ebook.isPublished) {
    throw makeError('전자책을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  // Check access: free ebook or purchased
  if (!ebook.isFree) {
    const access = await hasAccess(ebookId, userId);
    if (!access) {
      throw makeError('이 전자책에 접근할 권한이 없습니다.', 'FORBIDDEN', 403);
    }
  }

  const filePath = `/opt/coincraft-api/ebooks/${ebookId}.epub`;

  try {
    const buffer = await readFile(filePath);
    return buffer;
  } catch {
    throw makeError('전자책 파일을 찾을 수 없습니다.', 'FILE_NOT_FOUND', 404);
  }
}

export async function getEbookProgress(ebookId: string, userId: string): Promise<{ lastCfi: string }> {
  const [row] = await db
    .select({ lastCfi: ebookReadingProgress.lastCfi })
    .from(ebookReadingProgress)
    .where(
      and(
        eq(ebookReadingProgress.userId, userId),
        eq(ebookReadingProgress.ebookId, ebookId)
      )
    )
    .limit(1);

  return { lastCfi: row?.lastCfi ?? '' };
}

export async function upsertEbookProgress(
  ebookId: string,
  userId: string,
  cfi: string
): Promise<{ lastCfi: string }> {
  await db
    .insert(ebookReadingProgress)
    .values({
      userId,
      ebookId,
      lastCfi: cfi,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [ebookReadingProgress.userId, ebookReadingProgress.ebookId],
      set: {
        lastCfi: cfi,
        updatedAt: new Date(),
      },
    });

  return { lastCfi: cfi };
}
