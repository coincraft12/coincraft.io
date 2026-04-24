/**
 * 기존 레슨 스크립트 + 강의노트 일괄 생성
 * 실행: npx tsx src/scripts/backfill-lesson-notes.ts
 */

import 'dotenv/config';
import { eq, isNull, isNotNull, or } from 'drizzle-orm';
import { db } from '../db';
import { lessons, courses } from '../db/schema';
import { getVimeoTranscript } from '../lib/video-provider/vimeo';

const CONCURRENCY = 2; // 동시 처리 수 (API rate limit 고려)
const DELAY_MS = 2000; // 레슨 간 딜레이

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processLesson(lesson: {
  id: string;
  title: string;
  videoUrl: string;
  courseName: string | null;
}, index: number, total: number) {
  const tag = `[${index + 1}/${total}] "${lesson.title}"`;
  console.log(`\n${tag} 처리 시작`);

  try {
    // 1. Vimeo 자막 fetch
    console.log(`${tag} → 자막 수집 중...`);
    const transcript = await getVimeoTranscript(lesson.videoUrl);
    if (!transcript) {
      console.warn(`${tag} ⚠ 자막 없음 (스킵)`);
      await db.update(lessons).set({ notesStatus: 'error' }).where(eq(lessons.id, lesson.id));
      return;
    }
    // 2. transcript만 저장 (노트 생성은 강사가 직접)
    await db.update(lessons)
      .set({ transcript, notesStatus: 'transcript_ready' })
      .where(eq(lessons.id, lesson.id));

    console.log(`${tag} ✅ 자막 저장 완료 (${transcript.length}자)`);
  } catch (err) {
    console.error(`${tag} ❌ 오류:`, err);
    await db.update(lessons).set({ notesStatus: 'error' }).where(eq(lessons.id, lesson.id));
  }
}

async function main() {
  console.log('=== 레슨 강의노트 일괄 생성 시작 ===\n');

  // 영상 있고 transcript 없는 레슨만 조회
  const targets = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      videoUrl: lessons.videoUrl,
      courseName: courses.title,
    })
    .from(lessons)
    .leftJoin(courses, eq(lessons.courseId, courses.id))
    .where(
      isNotNull(lessons.videoUrl)
    )
    .then(rows => rows.filter(r =>
      r.videoUrl &&
      r.videoUrl.includes('vimeo.com')
    ));

  // 이미 완료된 것 제외 (done 상태)
  const pending = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(isNotNull(lessons.videoUrl))
    .then(() => targets); // 전체 재처리 (done 제외하려면 아래 주석 해제)

  // done 상태 제외
  const doneIds = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.notesStatus, 'done'))
    .then(rows => new Set(rows.map(r => r.id)));

  const toProcess = pending.filter(l => !doneIds.has(l.id));

  console.log(`대상: 총 ${targets.length}개 중 미완료 ${toProcess.length}개\n`);

  if (toProcess.length === 0) {
    console.log('처리할 레슨이 없습니다.');
    process.exit(0);
  }

  // CONCURRENCY 단위로 배치 처리
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((lesson, j) =>
        processLesson(lesson as any, i + j, toProcess.length)
      )
    );
    if (i + CONCURRENCY < toProcess.length) {
      await sleep(DELAY_MS);
    }
  }

  // 결과 요약
  const result = await db
    .select({ status: lessons.notesStatus })
    .from(lessons)
    .where(isNotNull(lessons.videoUrl));

  const summary = result.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n=== 완료 ===');
  console.log('결과:', summary);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
