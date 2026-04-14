import { eq, and, desc } from 'drizzle-orm';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from '../../db';
import { ebooks, ebookPurchases, ebookReadingProgress } from '../../db/schema';
import { UPLOADS_DIR } from '../upload/upload.routes';

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

// ─── EPUB Cover Extraction ────────────────────────────────────────────────────

/**
 * ZIP Central Directory 파싱으로 EPUB 내 파일 목록과 오프셋을 구한다.
 * 이미지 파일(jpg/png/gif/webp)을 찾아 커버 후보를 반환한다.
 */
function parseZipEntries(buf: Buffer): Array<{ name: string; offset: number; compressedSize: number; uncompressedSize: number; method: number }> {
  const entries: Array<{ name: string; offset: number; compressedSize: number; uncompressedSize: number; method: number }> = [];

  // End of Central Directory signature: 0x06054b50
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) return entries;

  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  const cdSize = buf.readUInt32LE(eocdOffset + 12);

  let pos = cdOffset;
  while (pos < cdOffset + cdSize) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break; // Central Directory signature
    const method = buf.readUInt16LE(pos + 10);
    const compressedSize = buf.readUInt32LE(pos + 20);
    const uncompressedSize = buf.readUInt32LE(pos + 24);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const localOffset = buf.readUInt32LE(pos + 42);
    const name = buf.subarray(pos + 46, pos + 46 + nameLen).toString('utf8');
    entries.push({ name, offset: localOffset, compressedSize, uncompressedSize, method });
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/**
 * Local File Header에서 실제 데이터 시작 오프셋을 구한다.
 */
function getLocalDataOffset(buf: Buffer, localOffset: number): number {
  if (buf.readUInt32LE(localOffset) !== 0x04034b50) return -1;
  const nameLen = buf.readUInt16LE(localOffset + 26);
  const extraLen = buf.readUInt16LE(localOffset + 28);
  return localOffset + 30 + nameLen + extraLen;
}

/**
 * method=0(저장)인 경우 데이터를 그대로, method=8(deflate)인 경우 zlib inflate.
 */
async function extractEntry(buf: Buffer, entry: { offset: number; compressedSize: number; uncompressedSize: number; method: number }): Promise<Buffer> {
  const dataOffset = getLocalDataOffset(buf, entry.offset);
  if (dataOffset < 0) throw new Error('Invalid local file header');
  const compressed = buf.subarray(dataOffset, dataOffset + entry.compressedSize);

  if (entry.method === 0) {
    return compressed;
  } else if (entry.method === 8) {
    const { inflateRaw } = await import('node:zlib');
    const { promisify } = await import('node:util');
    const inflateRawAsync = promisify(inflateRaw);
    return inflateRawAsync(compressed) as Promise<Buffer>;
  }
  throw new Error(`Unsupported compression method: ${entry.method}`);
}

/**
 * EPUB 파일에서 표지 이미지를 추출해 uploads 폴더에 저장하고,
 * DB의 coverImageUrl을 업데이트한다.
 */
export async function extractAndSaveCover(ebookId: string): Promise<{ coverImageUrl: string }> {
  const [ebook] = await db
    .select({ id: ebooks.id, isPublished: ebooks.isPublished })
    .from(ebooks)
    .where(eq(ebooks.id, ebookId))
    .limit(1);

  if (!ebook) {
    throw makeError('전자책을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const filePath = `/opt/coincraft-api/ebooks/${ebookId}.epub`;
  let buf: Buffer;
  try {
    buf = await readFile(filePath);
  } catch {
    throw makeError('전자책 파일을 찾을 수 없습니다.', 'FILE_NOT_FOUND', 404);
  }

  const entries = parseZipEntries(buf);

  // 1) OPF 파일에서 cover item 찾기
  const containerEntry = entries.find((e) => e.name === 'META-INF/container.xml');
  let coverImagePath: string | null = null;

  if (containerEntry) {
    try {
      const containerXml = (await extractEntry(buf, containerEntry)).toString('utf8');
      const opfPathMatch = containerXml.match(/full-path="([^"]+\.opf)"/i);
      if (opfPathMatch) {
        const opfRelPath = opfPathMatch[1];
        const opfEntry = entries.find((e) => e.name === opfRelPath);
        if (opfEntry) {
          const opfXml = (await extractEntry(buf, opfEntry)).toString('utf8');
          const opfDir = opfRelPath.includes('/') ? opfRelPath.replace(/\/[^/]+$/, '') : '';

          // cover-image 아이템 찾기
          const coverItemMatch = opfXml.match(/<item[^>]+properties="[^"]*cover-image[^"]*"[^>]+href="([^"]+)"/i)
            ?? opfXml.match(/<item[^>]+id="cover[^"]*"[^>]+href="([^"]+)"/i)
            ?? opfXml.match(/<meta[^>]+name="cover"[^>]+content="([^"]+)"/i);

          if (coverItemMatch) {
            let href = coverItemMatch[1];
            // meta content가 id인 경우 href 찾기
            if (!href.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              const itemById = opfXml.match(new RegExp(`<item[^>]+id="${href}"[^>]+href="([^"]+)"`, 'i'));
              if (itemById) href = itemById[1];
            }
            if (href.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              coverImagePath = opfDir ? `${opfDir}/${href}` : href;
            }
          }
        }
      }
    } catch {
      // OPF 파싱 실패 시 폴백
    }
  }

  // 2) OPF에서 못 찾으면 images/ 폴더의 첫 번째 이미지로 폴백
  if (!coverImagePath) {
    const imgEntry = entries.find((e) => /\.(jpg|jpeg|png|webp)$/i.test(e.name));
    if (imgEntry) coverImagePath = imgEntry.name;
  }

  if (!coverImagePath) {
    throw makeError('EPUB에서 표지 이미지를 찾을 수 없습니다.', 'COVER_NOT_FOUND', 422);
  }

  const coverEntry = entries.find((e) => e.name === coverImagePath);
  if (!coverEntry) {
    throw makeError('EPUB에서 표지 이미지를 추출할 수 없습니다.', 'COVER_NOT_FOUND', 422);
  }

  const imageBuffer = await extractEntry(buf, coverEntry);
  const ext = path.extname(coverImagePath).toLowerCase() || '.jpg';
  const filename = `ebook-cover-${ebookId}-${randomUUID()}${ext}`;

  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, filename), imageBuffer);

  const publicBase = (process.env.API_PUBLIC_URL ?? '').replace(/\/$/, '');
  const coverImageUrl = `${publicBase}/api/v1/files/${filename}`;

  await db
    .update(ebooks)
    .set({ coverImageUrl })
    .where(eq(ebooks.id, ebookId));

  return { coverImageUrl };
}
