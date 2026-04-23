import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const BUCKET = process.env.S3_BUCKET ?? 'coincraft-uploads';
const ENDPOINT = process.env.S3_ENDPOINT ?? 'https://hel1.your-objectstorage.com';
const REGION = process.env.S3_REGION ?? 'eu-central-1';
const SRC_DIR = 'F:/Workplace/_Archive/01_콘텐츠/시리즈/온체인분석/강의자료';
const COURSE_SLUG = 'on-chain-signals';

const s3 = new S3Client({
  endpoint: ENDPOINT, region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: false,
});

const FILE_MAP: Record<string, { lessonSearch: string; slug: string; title: string }> = {
  '1-1강. 온체인과 오프체인.pdf':                    { lessonSearch: '[1-1]', slug: 'onchain-1-1-온체인과-오프체인',              title: '1-1. 온체인과 오프체인' },
  '1-2강. 정보의 비대칭.pdf':                         { lessonSearch: '[1-2]', slug: 'onchain-1-2-정보의-비대칭',                 title: '1-2. 정보의 비대칭' },
  '1-3강. 온체인 분석의 장점과 한계.pdf':             { lessonSearch: '[1-3]', slug: 'onchain-1-3-온체인-분석의-장점과-한계',      title: '1-3. 온체인 분석의 장점과 한계' },
  '1-4강. 온체인 분석과 투자 전략.pdf':               { lessonSearch: '[1-4]', slug: 'onchain-1-4-온체인-분석과-투자-전략',        title: '1-4. 온체인 분석과 투자 전략' },
  '2-1강. 주소.pdf':                                  { lessonSearch: '[2-1]', slug: 'onchain-2-1-주소',                          title: '2-1. 주소' },
  '2-2강. 트랜잭션.pdf':                              { lessonSearch: '[2-2]', slug: 'onchain-2-2-트랜잭션',                       title: '2-2. 트랜잭션' },
  '2-3강. 블록.pdf':                                  { lessonSearch: '[2-3]', slug: 'onchain-2-3-블록',                          title: '2-3. 블록' },
  '2-4. 숨겨진 온체인의 진짜 흐름.pdf':               { lessonSearch: '[2-4]', slug: 'onchain-2-4-숨겨진-온체인의-진짜-흐름',      title: '2-4. 숨겨진 온체인의 진짜 흐름' },
  '3-1강. 이더스캔 개요 및 사용법.pdf':               { lessonSearch: '[3-1]', slug: 'onchain-3-1-이더스캔-개요-및-사용법',        title: '3-1. 이더스캔 개요 및 사용법' },
  '3-2강. 주소 프로필 읽는 법.pdf':                   { lessonSearch: '[3-2]', slug: 'onchain-3-2-주소-프로필-읽는-법',            title: '3-2. 주소 프로필 읽는 법' },
  '3-3. 트랜잭션 읽는 법.pdf':                        { lessonSearch: '[3-3]', slug: 'onchain-3-3-트랜잭션-읽는-법',               title: '3-3. 트랜잭션 읽는 법' },
  '3-4. 블록 읽는 법.pdf':                            { lessonSearch: '[3-4]', slug: 'onchain-3-4-블록-읽는-법',                   title: '3-4. 블록 읽는 법' },
  '4-1. Dune 데이터를 시각화 하다.pdf':               { lessonSearch: '[4-1]', slug: 'onchain-4-1-dune-데이터를-시각화하다',        title: '4-1. Dune 데이터를 시각화하다' },
  '4-2. 대시보드 탐색법.pdf':                         { lessonSearch: '[4-2]', slug: 'onchain-4-2-대시보드-탐색법',                title: '4-2. 대시보드 탐색법' },
  '4-3. 차트 구성요소.pdf':                           { lessonSearch: '[4-3]', slug: 'onchain-4-3-차트-구성요소',                  title: '4-3. 차트 구성요소' },
  '4-4. 나만의 차트 만들기.pdf':                      { lessonSearch: '[4-4]', slug: 'onchain-4-4-나만의-차트-만들기',              title: '4-4. 나만의 차트 만들기' },
  '5-1. 브릿지란 무엇인가.pdf':                       { lessonSearch: '[5-1]', slug: 'onchain-5-1-브릿지란-무엇인가',              title: '5-1. 브릿지란 무엇인가' },
  '5-2. 브릿지 방식의 분류.pdf':                      { lessonSearch: '[5-2]', slug: 'onchain-5-2-브릿지-방식의-분류',             title: '5-2. 브릿지 방식의 분류' },
  '5-3. 주요 브릿지 프로토콜과 주소.pdf':             { lessonSearch: '[5-3]', slug: 'onchain-5-3-주요-브릿지-프로토콜과-주소',    title: '5-3. 주요 브릿지 프로토콜과 주소' },
  '5-4. 온체인(On-chain)에서 추적하는 표준 흐름.pdf': { lessonSearch: '[5-4]', slug: 'onchain-5-4-온체인에서-추적하는-표준-흐름',  title: '5-4. 온체인에서 추적하는 표준 흐름' },
  '5-5. 브릿지 데이터의 집계와 시각화.pdf':           { lessonSearch: '[5-5]', slug: 'onchain-5-5-브릿지-데이터의-집계와-시각화', title: '5-5. 브릿지 데이터의 집계와 시각화' },
  '6-1. 스테이블 코인의 기본 구조.pdf':               { lessonSearch: '[6-1]', slug: 'onchain-6-1-스테이블코인의-기본-구조',       title: '6-1. 스테이블코인의 기본 구조' },
  '6-2. 온체인 순유입 분석.pdf':                      { lessonSearch: '[6-2]', slug: 'onchain-6-2-온체인-순유입-분석',             title: '6-2. 온체인 순유입 분석' },
  '6-3. 체인 간 이동 구조.pdf':                       { lessonSearch: '[6-3]', slug: 'onchain-6-3-체인-간-이동-구조',              title: '6-3. 체인 간 이동 구조' },
  '6-4. 실전 대시보드 구성.pdf':                      { lessonSearch: '[6-4]', slug: 'onchain-6-4-실전-대시보드-구성',             title: '6-4. 실전 대시보드 구성' },
  '7-1. 고래 주소의 정의와 선정 기준.pdf':            { lessonSearch: '[7-1]', slug: 'onchain-7-1-고래-주소의-정의와-선정-기준',   title: '7-1. 고래 주소의 정의와 선정 기준' },
  '7-2. 순유입 패턴과 시간 축 해석.pdf':              { lessonSearch: '[7-2]', slug: 'onchain-7-2-순유입-패턴과-시간축-해석',      title: '7-2. 순유입 패턴과 시간축 해석' },
  '7-3. 반복 루틴과 카운터파티 분석.pdf':             { lessonSearch: '[7-3]', slug: 'onchain-7-3-반복-루틴과-카운터파티-분석',    title: '7-3. 반복 루틴과 카운터파티 분석' },
  '7-4. 마지막 행동_ 스윕과 키교체.pdf':              { lessonSearch: '[7-4]', slug: 'onchain-7-4-마지막-행동-스윕과-키교체',      title: '7-4. 마지막 행동: 스윕과 키교체' },
  '7-5. 고래 분석 대시보드 실전 활용.pdf':            { lessonSearch: '[7-5]', slug: 'onchain-7-5-고래-분석-대시보드-실전-활용',   title: '7-5. 고래 분석 대시보드 실전 활용' },
  '8-1. 아캄(Arkham).pdf':                            { lessonSearch: '[8-1]', slug: 'onchain-8-1-arkham-아캄',                   title: '8-1. Arkham(아캄)' },
  '8-2. 낸샌(Nansen).pdf':                            { lessonSearch: '[8-2]', slug: 'onchain-8-2-nansen-낸샌',                   title: '8-2. Nansen(낸샌)' },
  '8-3. 디뱅크(Debank).pdf':                          { lessonSearch: '[8-3]', slug: 'onchain-8-3-debank-디뱅크',                  title: '8-3. Debank(디뱅크)' },
  '8-4. 유료vs무료플랜.pdf':                          { lessonSearch: '[8-3]', slug: 'onchain-8-4-유료vs무료-플랜',                title: '8-4. 유료 vs 무료 플랜' },
  '9-1. 온체인 분석가의 하루.pdf':                    { lessonSearch: '[9-1]', slug: 'onchain-9-1-온체인-분석가의-하루',            title: '9-1. 온체인 분석가의 하루' },
  '9-2. 스캠 토큰 구별.pdf':                          { lessonSearch: '[9-2]', slug: 'onchain-9-2-스캠-토큰-구별',                 title: '9-2. 스캠 토큰 구별' },
  '9-3. 러그풀 사례 온체인 분석.pdf':                 { lessonSearch: '[9-3]', slug: 'onchain-9-3-러그풀-사례-온체인-분석',        title: '9-3. 러그풀 사례 온체인 분석' },
  'A-1. AI 에이전트 시대 온체인 분석.pdf':            { lessonSearch: '[A-1]', slug: 'onchain-a1-ai-에이전트-시대-온체인-분석',    title: 'A-1. AI 에이전트 시대 온체인 분석' },
  'A-2. 스캠 토큰 구별법.pdf':                        { lessonSearch: '[A-2]', slug: 'onchain-a2-스캠-토큰-구별법',                title: 'A-2. 스캠 토큰 구별법' },
  'A-3. 러그풀 사례 분석.pdf':                        { lessonSearch: '[A-3]', slug: 'onchain-a3-러그풀-사례-분석',                title: 'A-3. 러그풀 사례 분석' },
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
    // 기존 데이터 삭제 (레슨 기준)
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

      // S3에 없을 때만 업로드 (로컬 실행 시)
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

      // 레슨 동적 조회
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
