import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const BUCKET = process.env.S3_BUCKET ?? 'coincraft-uploads';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'https://hel1.your-objectstorage.com';
const REGION = process.env.S3_REGION ?? 'eu-central-1';
const SRC_DIR = 'F:/Workplace/_Archive/01_콘텐츠/시리즈/WEB3구조설계자/강의자료/Basic';
const COURSE_SLUG = 'web3-architect-basic';

const s3 = new S3Client({
  endpoint: ENDPOINT, region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: false,
});

const FILE_MAP: Record<string, { lessonSearch: string; slug: string; title: string }> = {
  'ch1_Basic_중앙화 신뢰 구조 설명.pdf':       { lessonSearch: '중앙화 신뢰 구조',          slug: 'web3basic-ch1-중앙화-신뢰-구조',          title: 'Ch1. 중앙화 신뢰 구조' },
  'ch2_Basic_단일 기록 구조 분석.pdf':          { lessonSearch: '단일 기록 구조',             slug: 'web3basic-ch2-단일-기록-구조-분석',       title: 'Ch2. 단일 기록 구조 분석' },
  'ch3_Basic_권한 집중 구조 점검.pdf':          { lessonSearch: '권한 집중 구조',             slug: 'web3basic-ch3-권한-집중-구조-점검',       title: 'Ch3. 권한 집중 구조 점검' },
  'ch4_Basic_분산 신뢰 3층 구조.pdf':           { lessonSearch: '분산 신뢰 3층',              slug: 'web3basic-ch4-분산-신뢰-3층-구조',        title: 'Ch4. 분산 신뢰 3층 구조' },
  'ch5_Basic_키 기반 소유권 구조.pdf':          { lessonSearch: '키 기반 소유권',             slug: 'web3basic-ch5-키-기반-소유권-구조',       title: 'Ch5. 키 기반 소유권 구조' },
  'ch6_Basic_트랜잭션 구조 정의.pdf':           { lessonSearch: '트랜잭션 구조 정의',         slug: 'web3basic-ch6-트랜잭션-구조-정의',        title: 'Ch6. 트랜잭션 구조 정의' },
  'ch7_Basic_블록체인 최소 정의.pdf':           { lessonSearch: '블록체인의 최소',            slug: 'web3basic-ch7-블록체인-최소-정의',        title: 'Ch7. 블록체인의 최소 정의' },
  'ch8_Basic_지갑 개념 정의.pdf':               { lessonSearch: '지갑 개념 정의',             slug: 'web3basic-ch8-지갑-개념-정의',            title: 'Ch8. 지갑 개념 정의' },
  'ch9_Basic_주소(Address) 개념 정의.pdf':      { lessonSearch: '주소(Address)',              slug: 'web3basic-ch9-주소-개념-정의',            title: 'Ch9. 주소(Address) 개념 정의' },
  'ch10_Basic_트랜잭션 결과 구분.pdf':          { lessonSearch: '트랜잭션 결과 구분',         slug: 'web3basic-ch10-트랜잭션-결과-구분',       title: 'Ch10. 트랜잭션 결과 구분' },
  'ch11_Basic_가스(Gas) 조건 정의.pdf':         { lessonSearch: '가스(Gas)',                  slug: 'web3basic-ch11-가스-조건-정의',           title: 'Ch11. 가스(Gas) 조건 정의' },
  'ch12_Basic_스마트컨트랙트 계정 정의.pdf':    { lessonSearch: '스마트컨트랙트 계정',        slug: 'web3basic-ch12-스마트컨트랙트-계정-정의', title: 'Ch12. 스마트컨트랙트 계정 정의' },
  'ch13_Basic_토큰 기본 개념 정의.pdf':         { lessonSearch: '토큰 기본 개념',             slug: 'web3basic-ch13-토큰-기본-개념-정의',      title: 'Ch13. 토큰 기본 개념 정의' },
  'ch14_Basic_기본 시나리오 구조 해석.pdf':     { lessonSearch: '시나리오 구조',              slug: 'web3basic-ch14-기본-시나리오-구조-해석',  title: 'Ch14. 기본 시나리오 구조 해석' },
  'ch15_Basic_기본 위험요소 분류.pdf':          { lessonSearch: '위험요소',                   slug: 'web3basic-ch15-기본-위험요소-분류',       title: 'Ch15. 기본 위험요소 분류' },
  'ch16_Basic_기본 점검 체크리스트 작성.pdf':   { lessonSearch: '체크리스트',                 slug: 'web3basic-ch16-기본-점검-체크리스트',     title: 'Ch16. 기본 점검 체크리스트 작성' },
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
