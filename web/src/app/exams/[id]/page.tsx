import { notFound } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Badge from '@/components/ui/Badge';
import ExamCountdown from '@/components/exam/ExamCountdown';

const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4001';

interface CertExamDetail {
  id: string;
  title: string;
  level: string;
  description: string | null;
  passingScore: number;
  timeLimit: number;
  examFee: string;
  isActive: boolean;
  questionCount: number;
  prerequisiteCourse: { id: string; title: string; slug: string } | null;
}

async function getExam(id: string): Promise<CertExamDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/exams/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json() as { success: boolean; data: CertExamDetail };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function getLevelVariant(level: string): 'basic' | 'associate' | 'expert' | 'default' {
  if (level === 'basic') return 'basic';
  if (level === 'associate') return 'associate';
  if (level === 'expert') return 'expert';
  return 'default';
}

function getLevelLabel(level: string): string {
  const map: Record<string, string> = { basic: 'Basic', associate: 'Associate', expert: 'Expert' };
  return map[level] ?? level.toUpperCase();
}

// 레벨별 출제 과목
const SUBJECT_MAP: Record<string, { code: string; name: string }[]> = {
  basic: [
    { code: '01', name: '블록체인 기초 구조' },
    { code: '02', name: '암호화 기술 및 지갑' },
    { code: '03', name: '스마트컨트랙트 개요' },
    { code: '04', name: 'DeFi · NFT · 토큰 이코노미' },
    { code: '05', name: 'WEB3 인프라 및 생태계' },
  ],
  associate: [
    { code: '01', name: '온체인 데이터 분석' },
    { code: '02', name: '스마트컨트랙트 설계' },
    { code: '03', name: 'Layer 2 & 크로스체인' },
    { code: '04', name: 'DeFi 프로토콜 아키텍처' },
    { code: '05', name: 'WEB3 보안 및 감사' },
  ],
};

// 시험 일정 (DB에 없으므로 레벨별 하드코드, 추후 DB 이관)
const SCHEDULE_MAP: Record<string, { scheduledAt: string; displayDate: string; method: string }> = {
  basic: {
    scheduledAt: '2026-05-02T14:00:00+09:00',
    displayDate: '2026년 5월 2일 (토) 오후 2시',
    method: '온라인 비대면 · 일제 시작',
  },
};

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await getExam(id);

  if (!exam || !exam.isActive) notFound();

  const subjects = SUBJECT_MAP[exam.level] ?? [];
  const schedule = SCHEDULE_MAP[exam.level] ?? SCHEDULE_MAP['basic'];
  const levelLabel = getLevelLabel(exam.level);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl space-y-6">

          {/* 타이틀 */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={getLevelVariant(exam.level)}>CoinCraft {levelLabel}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-cc-text mb-2">{exam.title}</h1>
            {exam.description && (
              <p className="text-cc-muted text-sm leading-relaxed">{exam.description}</p>
            )}
          </div>

          {/* 시험 정보 */}
          <div className="bg-cc-secondary border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-bold text-cc-text mb-4">시험 정보</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: '시험 일시', value: schedule.displayDate },
                { label: '시험 방법', value: schedule.method },
                { label: '문항 수', value: `${exam.questionCount}문항 객관식` },
                { label: '제한 시간', value: `${exam.timeLimit}분` },
                { label: '합격 기준', value: `${exam.passingScore}점 이상 (100점 만점)` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-cc-muted">{label}</span>
                  <span className="text-sm font-semibold text-cc-text">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 출제 과목 */}
          {subjects.length > 0 && (
            <div className="bg-cc-secondary border border-white/10 rounded-xl p-6">
              <h2 className="text-sm font-bold text-cc-text mb-4">출제 과목</h2>
              <div className="space-y-2">
                {subjects.map((s) => (
                  <div key={s.code} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-cc-accent/10 text-cc-accent text-xs font-bold flex items-center justify-center shrink-0">
                      {s.code}
                    </span>
                    <span className="text-cc-text">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시험 당일 안내 */}
          <div className="bg-cc-secondary border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-bold text-cc-text mb-3">시험 당일 안내</h2>
            <ul className="space-y-1.5 text-sm text-cc-muted">
              <li>· 시험 <strong className="text-cc-text">1시간 전</strong>: 접속 환경 테스트 필수</li>
              <li>· 시험 <strong className="text-cc-text">30분 전</strong>: 신분증 확인 시작</li>
              <li>· 시험 링크는 당일 오전 9시 등록 이메일로 발송됩니다.</li>
              <li>· 탭 전환 3회 감지 시 자동 제출됩니다.</li>
            </ul>
          </div>

          {/* 카운트다운 + 시작 버튼 */}
          <ExamCountdown examId={exam.id} scheduledAt={schedule.scheduledAt} />

        </div>
      </main>
      <Footer />
    </>
  );
}
