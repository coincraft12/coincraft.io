/**
 * data-fix-20240424-onchain-signals-vimeo-urls.ts
 *
 * on-chain-signals 강좌 4-1~4-3 Vimeo URL 오류 수정
 * 원인: 업로드 순서와 DB 입력 순서 불일치로 URL이 한 칸씩 밀려 있었음
 *
 * 실행: DATABASE_URL=postgres://... npx ts-node scripts/data-fix-20240424-onchain-signals-vimeo-urls.ts
 * 적용 완료: local ✅ / staging ✅ / production ✅ (2026-04-24)
 */

import { Pool } from 'pg';

const DRY_RUN = process.env.DRY_RUN === 'true';

const FIXES: Array<{ description: string; sql: string; params: unknown[] }> = [
  {
    description: '[4-1] Dune 개요 — 1153678625 → 1153678404',
    sql: `UPDATE lessons SET video_url = $1 WHERE id = $2`,
    params: ['https://vimeo.com/1153678404', '93bcec98-797e-42ac-80f0-c9e0ab795e96'],
  },
  {
    description: '[4-2] Dune 화면과 검색 — 1153678540 → 1153678484',
    sql: `UPDATE lessons SET video_url = $1 WHERE id = $2`,
    params: ['https://vimeo.com/1153678484', 'f74b0624-2fb8-4caf-b17a-af690ebd9f80'],
  },
  {
    description: '[4-3] 차트 해석 — 1153678625 → 1153678540',
    sql: `UPDATE lessons SET video_url = $1 WHERE id = $2`,
    params: ['https://vimeo.com/1153678540', '6e3caf95-6d7c-44e9-9d7b-747825ebbc10'],
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (const fix of FIXES) {
      console.log(`\n[${DRY_RUN ? 'DRY RUN' : 'APPLY'}] ${fix.description}`);
      if (!DRY_RUN) {
        const result = await pool.query(fix.sql, fix.params);
        console.log(`  → ${result.rowCount}행 변경`);
      }
    }
    console.log('\n✅ 완료');
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
