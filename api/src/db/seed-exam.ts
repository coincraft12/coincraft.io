import 'dotenv/config';
import { db, pool } from './index';
import { certExams, examQuestions } from './schema';

async function seedExam() {
  console.log('Seeding exam data...');

  const [exam] = await db
    .insert(certExams)
    .values({
      title: 'CoinCraft Basic 자격 검정 (샘플)',
      level: 'basic',
      description: '블록체인 기초 개념을 검증하는 자격 시험입니다. 70점 이상 합격.',
      passingScore: 70,
      timeLimit: 60,
      isActive: true,
      examFee: '0',
    })
    .returning();

  console.log('Created exam:', exam.id);

  const questions = [
    {
      question: '블록체인에서 각 블록이 이전 블록과 연결되는 방법은?',
      options: ['IP 주소', '이전 블록의 해시값', 'UUID', '타임스탬프'],
      correctIndex: 1,
      explanation: '각 블록은 이전 블록의 해시값을 포함하여 체인 형태로 연결됩니다.',
      order: 1,
      points: 20,
    },
    {
      question: '비트코인의 최대 발행량은?',
      options: ['1,000만 개', '2,100만 개', '5,000만 개', '무제한'],
      correctIndex: 1,
      explanation: '비트코인의 총 발행량은 2,100만 개(21 million BTC)로 고정되어 있습니다.',
      order: 2,
      points: 20,
    },
    {
      question: '작업증명(Proof of Work)에서 채굴자들이 경쟁하는 대상은?',
      options: ['가장 긴 트랜잭션 생성', '특정 조건을 만족하는 해시값 찾기', '가장 빠른 서버 구축', 'NFT 민팅'],
      correctIndex: 1,
      explanation: '채굴자들은 특정 조건(예: 앞자리가 0으로 시작)을 만족하는 해시값을 찾는 경쟁을 합니다.',
      order: 3,
      points: 20,
    },
    {
      question: '스마트 컨트랙트(Smart Contract)란 무엇인가?',
      options: [
        '법원에서 인정하는 전자계약서',
        '블록체인 위에서 자동으로 실행되는 코드',
        '은행 간 결제 시스템',
        '암호화된 이메일',
      ],
      correctIndex: 1,
      explanation: '스마트 컨트랙트는 계약 조건이 충족되면 블록체인 위에서 자동으로 실행되는 프로그램입니다.',
      order: 4,
      points: 20,
    },
    {
      question: '탈중앙화 금융(DeFi)의 핵심 특징은?',
      options: [
        '중앙은행이 운영',
        '스마트 컨트랙트 기반 금융 서비스',
        '국가 규제 하에 운영',
        '기존 은행 앱의 업그레이드 버전',
      ],
      correctIndex: 1,
      explanation: 'DeFi는 스마트 컨트랙트를 기반으로 중개자 없이 금융 서비스를 제공합니다.',
      order: 5,
      points: 20,
    },
  ];

  await db.insert(examQuestions).values(
    questions.map((q) => ({
      examId: exam.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      order: q.order,
      points: q.points,
    }))
  );

  console.log(`Created ${questions.length} questions`);
  console.log('Seed complete!');
}

seedExam()
  .catch(console.error)
  .finally(() => pool.end());
