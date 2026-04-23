import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const BUCKET = process.env.S3_BUCKET ?? 'coincraft-uploads';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'https://hel1.your-objectstorage.com';
const REGION = process.env.S3_REGION ?? 'eu-central-1';
const SRC_DIR = 'F:/Workplace/_Archive/01_콘텐츠/시리즈/WEB3구조설계자/강의자료/Associate';
const COURSE_SLUG = 'web3-architect-associate';

const s3 = new S3Client({
  endpoint: ENDPOINT, region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: false,
});

const FILE_MAP: Record<string, { lessonSearch: string; slug: string; title: string }> = {
  'Associate_Intro_DECK.pdf': { lessonSearch: 'Associate 과정 인트로', slug: 'web3associate-intro',    title: 'Associate 과정 인트로' },
  'ch1_Multisig_DECK.pdf':    { lessonSearch: 'Multisig',              slug: 'web3associate-ch1-multisig',  title: '1강. Multisig 구조 정의' },
  'ch2_Timelock_DECK.pdf':    { lessonSearch: 'Timelock',              slug: 'web3associate-ch2-timelock',  title: '2강. Timelock 구조 정의' },
  'ch3_RBAC_DECK.pdf':        { lessonSearch: 'RBAC',                  slug: 'web3associate-ch3-rbac',      title: '3강. RBAC 구조 정의' },
  'ch4_Proxy_DECK.pdf':       { lessonSearch: 'Proxy',                 slug: 'web3associate-ch4-proxy',     title: '4강. Proxy와 Upgrade 패턴' },
  'ch5_AMM_DECK.pdf':         { lessonSearch: 'AMM',                   slug: 'web3associate-ch5-amm',       title: '5강. AMM 구조와 자산 흐름' },
  'ch6_Lending_DECK.pdf':     { lessonSearch: 'Lending',               slug: 'web3associate-ch6-lending',   title: '6강. Lending 구조와 자산 흐름' },
  'ch7_Bridge_DECK.pdf':      { lessonSearch: 'Bridge 구조와 크로스체인', slug: 'web3associate-ch7-bridge',  title: '7-1강. Bridge 구조와 크로스체인 자산 흐름' },
  'ch7_5_Bridge_Practical_Reading_DECK.pdf': { lessonSearch: 'Bridge 실전', slug: 'web3associate-ch7-5-bridge-practical', title: '7-2강. Bridge 실전 판독' },
  'ch8_Custody_DECK.pdf':     { lessonSearch: 'Custody구조',           slug: 'web3associate-ch8-custody',   title: '8강. Custody구조와 자산 보관 흐름' },
};

async function s3FileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    DELETE FROM chapter_materials
    WHERE lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN chapters c ON c.id = l.chapter_id
      JOIN courses co ON co.id = c.course_id
      WHERE co.slug = $1
    )
  `, [COURSE_SLUG]);

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
      [chapterId, lessonId, title, url, 'pdf', 0]
    );
    console.log(`✓ ${title}`);
  }

  await pool.end();
  console.log(`\n총 ${Object.keys(FILE_MAP).length}개 처리 완료`);
}

main().catch(console.error);
