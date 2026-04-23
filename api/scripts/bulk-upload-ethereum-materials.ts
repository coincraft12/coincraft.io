import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const BUCKET = process.env.S3_BUCKET ?? 'coincraft-uploads';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'https://hel1.your-objectstorage.com';
const REGION = process.env.S3_REGION ?? 'eu-central-1';
const SRC_DIR = 'F:/Workplace/_Archive/06_참고자료/아카이브/01_콘텐츠/시리즈/마스터링 이더리움/강의자료';
const COURSE_SLUG = 'ethereum-mastery-course';

const s3 = new S3Client({
  endpoint: ENDPOINT, region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: false,
});

const FILE_MAP: Record<string, { lessonSearch: string; slug: string; title: string }> = {
  '1강. 이더리움이란 무엇인가.pdf':      { lessonSearch: '이더리움이란 무엇인가',       slug: 'ethereum-1-이더리움이란-무엇인가',          title: '1강. 이더리움이란 무엇인가' },
  '2강. 이더리움 기초.pdf':              { lessonSearch: '이더리움 기초',               slug: 'ethereum-2-이더리움-기초',                  title: '2강. 이더리움 기초' },
  '3강. 이더리움 클라이언트.pdf':        { lessonSearch: '이더리움 클라이언트',         slug: 'ethereum-3-이더리움-클라이언트',            title: '3강. 이더리움 클라이언트' },
  '4강. 암호학.pdf':                     { lessonSearch: '암호학',                      slug: 'ethereum-4-암호학',                         title: '4강. 암호학' },
  '5강. 지갑.pdf':                       { lessonSearch: '지갑',                        slug: 'ethereum-5-지갑',                           title: '5강. 지갑' },
  '6강. 트랜잭션.pdf':                   { lessonSearch: '트랜잭션',                    slug: 'ethereum-6-트랜잭션',                       title: '6강. 트랜잭션' },
  '7강. 스마트컨트랙트와 솔리디티.pdf': { lessonSearch: '솔리디티',                    slug: 'ethereum-7-스마트컨트랙트와-솔리디티',     title: '7강. 스마트컨트랙트와 솔리디티' },
  '8강. 스마트컨트랙트와 바이퍼.pdf':   { lessonSearch: '바이퍼',                      slug: 'ethereum-8-스마트컨트랙트와-바이퍼',       title: '8강. 스마트컨트랙트와 바이퍼' },
  '9강. 스마트 컨트랙트 보안.pdf':       { lessonSearch: '컨트랙트 보안',               slug: 'ethereum-9-스마트-컨트랙트-보안',           title: '9강. 스마트 컨트랙트 보안' },
  '10강. 토큰.pdf':                      { lessonSearch: '토큰',                        slug: 'ethereum-10-토큰',                          title: '10강. 토큰' },
  '11강. 오라클.pdf':                    { lessonSearch: '오라클',                      slug: 'ethereum-11-오라클',                        title: '11강. 오라클' },
  '12강. 디앱.pdf':                      { lessonSearch: '디앱',                        slug: 'ethereum-12-디앱',                          title: '12강. 디앱' },
  '13강. EVM.pdf':                       { lessonSearch: 'EVM',                         slug: 'ethereum-13-evm',                           title: '13강. EVM' },
  '14강. 합의.pdf':                      { lessonSearch: '합의',                        slug: 'ethereum-14-합의',                          title: '14강. 합의' },
};

async function s3FileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      DELETE FROM chapter_materials
      WHERE lesson_id IN (
        SELECT l.id FROM lessons l
        JOIN chapters c ON c.id = l.chapter_id
        JOIN courses co ON co.id = c.course_id
        WHERE co.slug = $1
      )
    `, [COURSE_SLUG]);

    let order = 0;
    for (const [filename, { lessonSearch, slug, title }] of Object.entries(FILE_MAP)) {
      const key = `materials/${slug}.pdf`;
      const url = `${ENDPOINT}/${BUCKET}/${key}`;

      const exists = await s3FileExists(key);
      if (!exists) {
        try {
          const buffer = await fs.readFile(path.join(SRC_DIR, filename));
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: buffer,
            ContentType: 'application/pdf', ACL: 'public-read',
          }));
        } catch {
          console.warn(`⚠ S3 업로드 실패 (파일 없음?): ${filename}`);
          continue;
        }
      }

      const { rows: lessonRows } = await pool.query(`
        SELECT l.id, l.chapter_id FROM lessons l
        JOIN chapters c ON c.id = l.chapter_id
        JOIN courses co ON co.id = c.course_id
        WHERE co.slug = $1 AND l.title ILIKE $2
        LIMIT 1
      `, [COURSE_SLUG, `%${lessonSearch}%`]);

      if (!lessonRows[0]) { console.warn(`⚠ 레슨 없음 (${lessonSearch}): ${title}`); continue; }
      const { id: lessonId, chapter_id: chapterId } = lessonRows[0];

      await pool.query(
        'INSERT INTO chapter_materials (chapter_id, lesson_id, title, file_url, file_type, "order") VALUES ($1, $2, $3, $4, $5, $6)',
        [chapterId, lessonId, title, url, 'pdf', order]
      );
      order++;
      console.log(`✓ ${title}`);
    }

    console.log(`\n총 ${Object.keys(FILE_MAP).length}개 처리 완료`);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
