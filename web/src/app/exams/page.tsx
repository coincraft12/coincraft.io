import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Badge from '@/components/ui/Badge';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface CertExam {
  id: string;
  title: string;
  level: string;
  description: string | null;
  passingScore: number;
  timeLimit: number;
  examFee: string;
  prerequisiteCourseId: string | null;
  questionCount?: number;
}

interface ExamsResponse {
  success: boolean;
  data: CertExam[];
}

async function getExams(): Promise<CertExam[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/exams`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json: ExamsResponse = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

function getLevelVariant(level: string): 'basic' | 'associate' | 'expert' | 'default' {
  if (level === 'basic') return 'basic';
  if (level === 'associate') return 'associate';
  if (level === 'expert') return 'expert';
  return 'default';
}

function getLevelLabel(level: string): string {
  const map: Record<string, string> = {
    basic: 'Basic',
    associate: 'Associate',
    expert: 'Expert',
  };
  return map[level] ?? level.toUpperCase();
}

function getLevelOrder(level: string): number {
  return { basic: 0, associate: 1, expert: 2 }[level] ?? 99;
}

export default async function ExamsPage() {
  const exams = await getExams();

  const levels = ['basic', 'associate', 'expert'];
  const grouped: Record<string, CertExam[]> = { basic: [], associate: [], expert: [] };
  for (const exam of exams) {
    if (grouped[exam.level]) grouped[exam.level].push(exam);
    else grouped['basic'].push(exam);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="cc-label mb-2">CERTIFICATION</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text mb-4">
              CoinCraft 자격 검정
            </h1>
            <p className="text-cc-muted max-w-xl mx-auto">
              블록체인 전문성을 공식 자격증으로 증명하세요.
              Basic · Associate · Expert 3단계 트랙으로 성장하세요.
            </p>
          </div>

          {/* Level sections */}
          {levels.map((level) => {
            const levelExams = grouped[level];
            if (levelExams.length === 0) return null;

            return (
              <div key={level} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant={getLevelVariant(level)} className="text-sm px-3 py-1">
                    {getLevelLabel(level)}
                  </Badge>
                  <span className="text-cc-muted text-sm">{levelExams.length}개 시험</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {levelExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-4 hover:border-cc-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-cc-text font-semibold leading-snug">{exam.title}</h3>
                        <Badge variant={getLevelVariant(exam.level)}>
                          {getLevelLabel(exam.level)}
                        </Badge>
                      </div>

                      {exam.description && (
                        <p className="text-cc-muted text-sm leading-relaxed line-clamp-2">
                          {exam.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-cc-muted">합격</p>
                          <p className="text-cc-text font-bold">{exam.passingScore}점</p>
                        </div>
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-cc-muted">제한</p>
                          <p className="text-cc-text font-bold">{exam.timeLimit}분</p>
                        </div>
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-cc-muted">응시료</p>
                          <p className="text-cc-text font-bold">
                            {parseFloat(exam.examFee) === 0 ? '무료' : `₩${Number(exam.examFee).toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      {exam.prerequisiteCourseId && (
                        <p className="text-xs text-yellow-400/80 bg-yellow-400/10 rounded px-3 py-2">
                          사전 이수 강좌 완료 필요
                        </p>
                      )}

                      <Link
                        href={`/exams/${exam.id}`}
                        className="block w-full text-center px-4 py-2.5 bg-cc-accent text-[#1a1a2e] font-semibold rounded text-sm hover:opacity-90 transition-opacity"
                      >
                        시험 상세 보기
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {exams.length === 0 && (
            <div className="text-center py-24 text-cc-muted">
              <p className="text-4xl mb-4">📋</p>
              <p>현재 응시 가능한 시험이 없습니다.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
