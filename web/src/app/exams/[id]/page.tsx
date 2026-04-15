import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Badge from '@/components/ui/Badge';

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
  createdAt: string;
}

interface ExamResponse {
  success: boolean;
  data: CertExamDetail;
}

async function getExam(id: string): Promise<CertExamDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/exams/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json: ExamResponse = await res.json();
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

export default async function ExamDetailPage({ params }: { params: { id: string } }) {
  const exam = await getExam(params.id);

  if (!exam || !exam.isActive) {
    notFound();
  }

  const isFree = parseFloat(exam.examFee) === 0;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl">
          {/* Back */}
          <Link href="/exams" className="text-sm text-cc-muted hover:text-cc-accent transition-colors mb-6 inline-block">
            ← 시험 목록으로
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={getLevelVariant(exam.level)}>
                CoinCraft {getLevelLabel(exam.level)}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-cc-text mb-3">{exam.title}</h1>
            {exam.description && (
              <p className="text-cc-muted leading-relaxed">{exam.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 mb-6">
            <h2 className="text-cc-text font-semibold mb-4">시험 개요</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-cc-muted">문제 수</p>
                <p className="text-cc-text font-bold text-lg">{exam.questionCount}문제</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-cc-muted">제한 시간</p>
                <p className="text-cc-text font-bold text-lg">{exam.timeLimit}분</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-cc-muted">합격 기준</p>
                <p className="text-cc-text font-bold text-lg">{exam.passingScore}점 이상</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-cc-muted">응시료</p>
                <p className="text-cc-text font-bold text-lg">
                  {isFree ? '무료' : `₩${Number(exam.examFee).toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>

          {/* Prerequisite */}
          {exam.prerequisiteCourse && (
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-cc p-4 mb-6">
              <p className="text-yellow-400 text-sm font-semibold mb-1">사전 이수 필요</p>
              <p className="text-yellow-300/80 text-sm">
                이 시험에 응시하려면{' '}
                <Link href={`/courses/${exam.prerequisiteCourse.slug}`} className="underline">
                  {exam.prerequisiteCourse.title}
                </Link>
                을(를) 먼저 수강해야 합니다.
              </p>
            </div>
          )}

          {/* Notice */}
          <div className="bg-cc-secondary border border-white/10 rounded-cc p-4 mb-8 text-sm text-cc-muted space-y-1">
            <p className="text-cc-text font-semibold mb-2">응시 안내</p>
            <p>• 시험 시작 후 중단 시 시도 횟수로 카운트됩니다.</p>
            <p>• 탭 전환이 3회 감지되면 자동 제출됩니다.</p>
            <p>• 복사/붙여넣기 및 우클릭이 제한됩니다.</p>
            <p>• 제한 시간 종료 시 자동으로 제출됩니다.</p>
          </div>

          {/* CTA */}
          <Link
            href={isFree ? `/exams/${exam.id}/attempt` : `/checkout/exam/${exam.id}`}
            className="block w-full text-center px-6 py-3.5 bg-cc-accent text-[#1a1a2e] font-bold rounded-cc hover:opacity-90 transition-opacity text-base"
          >
            {isFree ? '시험 시작하기' : `₩${Number(exam.examFee).toLocaleString()} 결제 후 응시`}
          </Link>
          <p className="text-xs text-cc-muted text-center mt-3">
            시험 시작 전 로그인이 필요합니다.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
