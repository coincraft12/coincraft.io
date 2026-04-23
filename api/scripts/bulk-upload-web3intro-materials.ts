import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const BUCKET = process.env.S3_BUCKET ?? 'coincraft-uploads';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'https://hel1.your-objectstorage.com';
const REGION = process.env.S3_REGION ?? 'eu-central-1';
const SRC_DIR = 'F:/Workplace/_Archive/06_참고자료/아카이브/01_콘텐츠/시리즈/초급자과정/강의자료';
const COURSE_SLUG = 'web3-survival-intro';

const s3 = new S3Client({
  endpoint: ENDPOINT, region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: false,
});

const FILE_MAP: Record<string, { sourceFile: string; lessonSearch: string; slug: string; title: string }> = {
  '1강. 왜 지금 WEB3X암호화폐를 배워야 할까.pdf':      { sourceFile: '1강. 왜 지금 WEB3X암호화폐를 배워야 할까.pdf',      lessonSearch: '[1강]',   slug: 'web3intro-1-왜-지금-web3를-배워야-할까',          title: '1강. 왜 지금 WEB3를 배워야 할까' },
  '2강. 화폐의 진화, 신뢰의 재설계.pdf':               { sourceFile: '2강. 화폐의 진화, 신뢰의 재설계.pdf',               lessonSearch: '[2강]',   slug: 'web3intro-2-화폐의-진화-신뢰의-재설계',           title: '2강. 화폐의 진화, 신뢰의 재설계' },
  '3-1~2. 지갑_거래소.pdf':                            { sourceFile: '3-1~2. 지갑_거래소.pdf',                            lessonSearch: '[3-1강]', slug: 'web3intro-3-1-지갑-거래소',                        title: '3강. 지갑과 거래소' },
  '3-1~2. 지갑_거래소.pdf#3-2':                        { sourceFile: '3-1~2. 지갑_거래소.pdf',                            lessonSearch: '[3-2강]', slug: 'web3intro-3-2-지갑-거래소',                        title: '3강. 지갑과 거래소' },
  '3-3. 트랜잭션과 거래실습.pdf':                      { sourceFile: '3-3. 트랜잭션과 거래실습.pdf',                      lessonSearch: '[3-3강]', slug: 'web3intro-3-3-트랜잭션과-거래실습',               title: '3강. 트랜잭션과 거래실습' },
  '3-4. 스마트컨트랙트란 무엇인가.pdf':                { sourceFile: '3-4. 스마트컨트랙트란 무엇인가.pdf',                lessonSearch: '[3-4강]', slug: 'web3intro-3-4-스마트컨트랙트란-무엇인가',         title: '3강. 스마트컨트랙트란 무엇인가' },
  '3-5. 토큰이란 무엇인가.pdf':                        { sourceFile: '3-5. 토큰이란 무엇인가.pdf',                        lessonSearch: '[3-5강]', slug: 'web3intro-3-5-토큰이란-무엇인가',                 title: '3강. 토큰이란 무엇인가' },
  '5-1강. 국경 없는 송금과 해외 결제.pdf':             { sourceFile: '5-1강. 국경 없는 송금과 해외 결제.pdf',             lessonSearch: '[5-1강]', slug: 'web3intro-5-1-국경없는-송금과-해외결제',           title: '5-1강. 국경 없는 송금과 해외 결제' },
  '5-2강. 디파이와 은행 없이 가능한 송금.pdf':         { sourceFile: '5-2강. 디파이와 은행 없이 가능한 송금.pdf',         lessonSearch: '[5-2강]', slug: 'web3intro-5-2-디파이와-은행없이-가능한-송금',     title: '5-2강. 디파이와 은행 없이 가능한 송금' },
  '5-3강. 화폐의 디지털화와 RWA.pdf':                  { sourceFile: '5-3강. 화폐의 디지털화와 RWA.pdf',                  lessonSearch: '[5-3강]', slug: 'web3intro-5-3-화폐의-디지털화와-rwa',             title: '5-3강. 화폐의 디지털화와 RWA' },
  '5-4강. 블록체인 게임, NFTㆍ메타버스에서의 실험.pdf': { sourceFile: '5-4강. 블록체인 게임, NFTㆍ메타버스에서의 실험.pdf', lessonSearch: '[5-4강]', slug: 'web3intro-5-4-블록체인게임-nft-메타버스',   title: '5-4강. 블록체인 게임, NFT·메타버스에서의 실험' },
  '5-5강. 탈중앙 신원과 디지털 권리.pdf':              { sourceFile: '5-5강. 탈중앙 신원과 디지털 권리.pdf',              lessonSearch: '[5-5강]', slug: 'web3intro-5-5-탈중앙-신원과-디지털-권리',         title: '5-5강. 탈중앙 신원과 디지털 권리' },
  '5-6강. DePIN과 현실 인프라 연결.pdf':               { sourceFile: '5-6강. DePIN과 현실 인프라 연결.pdf',               lessonSearch: '[5-6강]', slug: 'web3intro-5-6-depin과-현실-인프라-연결',           title: '5-6강. DePIN과 현실 인프라 연결' },
  '6-1강. 새로운 기회의 문.pdf':                       { sourceFile: '6-1강. 새로운 기회의 문.pdf',                       lessonSearch: '[6-1강]', slug: 'web3intro-6-1-새로운-기회의-문',                  title: '6-1강. 새로운 기회의 문' },
  '6-2강. 내 경험이 새롭게 태어나는 길.pdf':           { sourceFile: '6-2강. 내 경험이 새롭게 태어나는 길.pdf',           lessonSearch: '[6-2강]', slug: 'web3intro-6-2-내-경험이-새롭게-태어나는-길',      title: '6-2강. 내 경험이 새롭게 태어나는 길' },
  '6-3강. 은퇴 이후, 열리는 또 하나의 무대.pdf':       { sourceFile: '6-3강. 은퇴 이후, 열리는 또 하나의 무대.pdf',       lessonSearch: '[6-3강]', slug: 'web3intro-6-3-은퇴-이후-열리는-또-하나의-무대',  title: '6-3강. 은퇴 이후, 열리는 또 하나의 무대' },
  '6-4강. 앞으로 걸어가야 할 길.pdf':                  { sourceFile: '6-4강. 앞으로 걸어가야 할 길.pdf',                  lessonSearch: '[6-4강]', slug: 'web3intro-6-4-앞으로-걸어가야-할-길',             title: '6-4강. 앞으로 걸어가야 할 길' },
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
    for (const [, { sourceFile, lessonSearch, slug, title }] of Object.entries(FILE_MAP)) {
      const key = `materials/${slug}.pdf`;
      const url = `${ENDPOINT}/${BUCKET}/${key}`;

      const exists = await s3FileExists(key);
      if (!exists) {
        try {
          const buffer = await fs.readFile(path.join(SRC_DIR, sourceFile));
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: buffer,
            ContentType: 'application/pdf', ACL: 'public-read',
          }));
        } catch {
          console.warn(`⚠ S3 업로드 실패 (파일 없음?): ${sourceFile}`);
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
