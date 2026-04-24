import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

const client = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export interface AIAnswerGenerationInput {
  courseName: string;
  lessonTitle: string;
  lessonContent: string;
  questionTitle: string;
  questionContent: string;
}

export async function generateAIAnswer(input: AIAnswerGenerationInput): Promise<{
  content: string;
  model: string;
  tokensUsed: number;
}> {
  const prompt = `당신은 온라인 강의 플랫폼의 AI 튜터입니다. 학생의 질문에 강의 내용을 바탕으로 친절하게 답변해주세요.

[강좌 정보]
강좌명: ${input.courseName}
강의명: ${input.lessonTitle}

[강의 내용]
${input.lessonContent}

[학생 질문]
제목: ${input.questionTitle}
내용: ${input.questionContent}

위 강의 내용을 기반으로 학생의 질문에 친절하고 명확하게 답변해주세요.
강의 내용에서 직접 관련된 부분을 인용하여 설명하면 더 좋습니다.
답변은 학생이 이해하기 쉬운 언어로 작성해주세요.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0].type === 'text' ? message.content[0].text : '';
  const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

  return {
    content,
    model: 'claude-sonnet-4-5',
    tokensUsed,
  };
}

export async function generateLectureNotes(input: {
  lessonTitle: string;
  courseName: string;
  transcript: string;
}): Promise<string> {
  const prompt = `당신은 온라인 강의 플랫폼의 콘텐츠 편집자입니다.
아래는 "${input.courseName}" 강좌의 "${input.lessonTitle}" 강의 영상 자막입니다.
이 자막을 바탕으로 수강생이 복습하기 좋은 강의노트를 마크다운 형식으로 작성해주세요.

[작성 규칙]
- 핵심 개념과 용어는 **굵게** 표시
- 중요 흐름은 번호 목록으로 정리
- 보충 설명은 인용 블록(>) 활용
- 코드나 명령어가 있으면 코드 블록 사용
- 분량: 강의 내용에 비례하게, 너무 짧거나 과도하게 길지 않게

[자막]
${input.transcript.slice(0, 8000)}

위 자막 내용을 바탕으로 강의노트를 작성해주세요.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

export async function analyzeQuestionDifficulty(
  questionContent: string
): Promise<'easy' | 'medium' | 'hard'> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `다음 학생의 질문이 얼마나 어려운지 분석하고 "easy", "medium", "hard" 중 하나로만 답해주세요. 다른 설명은 하지 마세요.\n\n질문: ${questionContent}`,
      },
    ],
  });

  const response = message.content[0].type === 'text' ? message.content[0].text : 'medium';
  const level = response.toLowerCase().includes('hard')
    ? 'hard'
    : response.toLowerCase().includes('easy')
      ? 'easy'
      : 'medium';

  return level;
}
