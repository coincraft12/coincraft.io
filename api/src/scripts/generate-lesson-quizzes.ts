/**
 * 레슨 transcript → 퀴즈 자동 생성
 * 실행: npx tsx src/scripts/generate-lesson-quizzes.ts
 * 특정 레슨만: LESSON_IDS=uuid1,uuid2 npx tsx src/scripts/generate-lesson-quizzes.ts
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { eq, isNotNull, inArray, and, ne } from 'drizzle-orm';
import { db } from '../db';
import { lessons, lessonQuizzes } from '../db/schema';

const CONCURRENCY = 2;
const DELAY_MS = 2000;
const QUESTIONS_PER_LESSON = 5;

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

async function generateQuizFromTranscript(
  title: string,
  transcript: string
): Promise<QuizQuestion[]> {
  const prompt = `다음은 "${title}" 강의의 스크립트입니다.

<transcript>
${transcript.slice(0, 8000)}
</transcript>

이 강의 내용을 바탕으로 수강생의 이해도를 확인할 수 있는 4지선다 퀴즈 ${QUESTIONS_PER_LESSON}개를 만들어주세요.

요구사항:
- 강의에서 실제로 다룬 핵심 개념, 사실, 특징을 기반으로 출제
- 정답이 명확하고 오답 3개도 그럴듯하게 구성
- 단순 암기보다 개념 이해를 확인하는 문제 위주
- 각 문제에 간결한 해설 포함 (1-2문장)
- 반드시 아래 JSON 형식으로만 응답 (다른 텍스트 없이)

[
  {
    "question": "문제 내용",
    "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
    "correctIndex": 0,
    "explanation": "해설"
  }
]`;

  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // JSON 파싱
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('JSON 파싱 실패: ' + text.slice(0, 200));

  const parsed = JSON.parse(jsonMatch[0]) as QuizQuestion[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('빈 퀴즈 응답');
  }
  return parsed;
}

async function processLesson(
  lesson: { id: string; title: string; transcript: string },
  index: number,
  total: number
) {
  const tag = `[${index + 1}/${total}] "${lesson.title}"`;
  console.log(`\n${tag} 퀴즈 생성 시작`);

  try {
    await db.update(lessons).set({ quizStatus: 'generating' }).where(eq(lessons.id, lesson.id));

    const questions = await generateQuizFromTranscript(lesson.title, lesson.transcript);

    // 기존 퀴즈 삭제 후 재삽입
    await db.delete(lessonQuizzes).where(eq(lessonQuizzes.lessonId, lesson.id));
    await db.insert(lessonQuizzes).values(
      questions.map((q, i) => ({
        lessonId: lesson.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        order: i,
      }))
    );

    await db.update(lessons).set({ quizStatus: 'done' }).where(eq(lessons.id, lesson.id));
    console.log(`${tag} ✅ ${questions.length}개 퀴즈 생성 완료`);
  } catch (err) {
    console.error(`${tag} ❌ 오류:`, err);
    await db.update(lessons).set({ quizStatus: 'error' }).where(eq(lessons.id, lesson.id));
  }
}

async function main() {
  console.log('=== 레슨 퀴즈 일괄 생성 시작 ===\n');

  const specificIds = process.env.LESSON_IDS?.split(',').filter(Boolean);

  let targets: { id: string; title: string; transcript: string }[];

  if (specificIds && specificIds.length > 0) {
    targets = await db
      .select({ id: lessons.id, title: lessons.title, transcript: lessons.transcript })
      .from(lessons)
      .where(and(inArray(lessons.id, specificIds), isNotNull(lessons.transcript)))
      .then(rows => rows.filter(r => r.transcript) as { id: string; title: string; transcript: string }[]);
  } else {
    // transcript 있고 퀴즈 미완료 레슨
    targets = await db
      .select({ id: lessons.id, title: lessons.title, transcript: lessons.transcript })
      .from(lessons)
      .where(and(isNotNull(lessons.transcript), ne(lessons.quizStatus, 'done')))
      .then(rows => rows.filter(r => r.transcript) as { id: string; title: string; transcript: string }[]);
  }

  console.log(`대상: ${targets.length}개 레슨\n`);

  if (targets.length === 0) {
    console.log('처리할 레슨이 없습니다.');
    process.exit(0);
  }

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((l, j) => processLesson(l, i + j, targets.length)));
    if (i + CONCURRENCY < targets.length) await sleep(DELAY_MS);
  }

  const summary = await db
    .select({ quizStatus: lessons.quizStatus })
    .from(lessons)
    .where(isNotNull(lessons.transcript))
    .then(rows =>
      rows.reduce((acc, r) => {
        acc[r.quizStatus] = (acc[r.quizStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );

  console.log('\n=== 완료 ===');
  console.log('결과:', summary);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
