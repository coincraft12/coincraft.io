/**
 * 짧은(미완성) 강의노트 재생성
 * 실행: npx tsx src/scripts/regen-short-notes.ts
 */
import 'dotenv/config';
import { eq, and, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '../db';
import { lessons, courses } from '../db/schema';
import { generateLectureNotes } from '../lib/anthropic';

const MIN_LENGTH = 3500; // 이 미만은 잘린 것으로 간주
const CONCURRENCY = 2;
const DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const targets = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      transcript: lessons.transcript,
      courseName: courses.title,
      contentLen: sql<number>`length(${lessons.textContent})`,
    })
    .from(lessons)
    .leftJoin(courses, eq(lessons.courseId, courses.id))
    .where(
      and(
        eq(lessons.notesStatus, 'done'),
        isNotNull(lessons.transcript),
        lt(sql`length(${lessons.textContent})`, MIN_LENGTH)
      )
    )
    .orderBy(sql`length(${lessons.textContent}) ASC`);

  // test 레슨 제외
  const toProcess = targets.filter(l => l.title !== 'test' && l.transcript);

  console.log(`재생성 대상: ${toProcess.length}개 (${MIN_LENGTH}자 미만)\n`);

  let done = 0, failed = 0;

  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (lesson) => {
      try {
        const notes = await generateLectureNotes({
          lessonTitle: lesson.title,
          courseName: lesson.courseName || '강의',
          transcript: lesson.transcript!,
        });

        await db.update(lessons)
          .set({ textContent: notes })
          .where(eq(lessons.id, lesson.id));

        done++;
        console.log(`[${done + failed}/${toProcess.length}] ✅ ${lesson.title} (${notes.length}자)`);
      } catch (err) {
        failed++;
        console.error(`[${done + failed}/${toProcess.length}] ❌ ${lesson.title}:`, err);
      }
    }));

    if (i + CONCURRENCY < toProcess.length) await sleep(DELAY_MS);
  }

  console.log(`\n완료: ✅ ${done}개 / ❌ ${failed}개`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
