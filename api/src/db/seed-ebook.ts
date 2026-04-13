import 'dotenv/config';
import { db, pool } from './index';
import { ebooks } from './schema';

async function seedEbook() {
  console.log('Seeding sample ebook...');

  const sampleEbookId = 'a0000000-0000-0000-0000-000000000001';

  await db
    .insert(ebooks)
    .values({
      id: sampleEbookId,
      slug: 'alice-in-wonderland-sample',
      title: 'Alice in Wonderland (샘플)',
      description: '이상한 나라의 앨리스 — EPUB 뷰어 테스트용 샘플 전자책입니다.',
      isFree: true,
      isPublished: true,
      epubUrl: `/opt/coincraft-api/ebooks/${sampleEbookId}.epub`,
      price: '0',
    })
    .onConflictDoNothing();

  console.log(`Sample ebook inserted: ${sampleEbookId}`);
  await pool.end();
}

seedEbook().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
