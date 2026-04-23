/**
 * data-fix-YYYYMMDD-description.ts
 *
 * 실행 방법:
 *   npx ts-node -e "require('dotenv').config({path:'.env.local'})" scripts/data-fix-YYYYMMDD-description.ts
 *
 * 또는 .env.local이 없을 때:
 *   DATABASE_URL=postgres://... npx ts-node scripts/data-fix-YYYYMMDD-description.ts
 *
 * 원칙:
 * - 멱등(idempotent): 여러 번 실행해도 결과 동일
 * - DRY RUN 먼저: DRY_RUN=true 로 실행하면 쿼리 출력만 하고 실제 변경 없음
 * - 각 환경(local, staging, prod)에 별도로 실행 필요
 * - 완료 후 STATUS.md "마지막 작업" 에 실행 환경 기록
 */

import { Pool } from 'pg';

const DRY_RUN = process.env.DRY_RUN === 'true';

// ── 수정 내용 정의 ────────────────────────────────────────────────
const FIXES: Array<{ description: string; sql: string; params?: unknown[] }> = [
  // 예시:
  // {
  //   description: '[4-1] Vimeo URL 수정',
  //   sql: `UPDATE lessons SET video_url = $1 WHERE id = $2`,
  //   params: ['https://vimeo.com/1153678404', '93bcec98-797e-42ac-80f0-c9e0ab795e96'],
  // },
];

async function main() {
  if (FIXES.length === 0) {
    console.log('수정 항목이 없습니다. FIXES 배열을 채워주세요.');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (const fix of FIXES) {
      console.log(`\n[${DRY_RUN ? 'DRY RUN' : 'APPLY'}] ${fix.description}`);
      console.log(`  SQL: ${fix.sql}`);
      if (fix.params) console.log(`  Params: ${JSON.stringify(fix.params)}`);

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
