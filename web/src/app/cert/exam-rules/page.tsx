import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = { title: '시험 관리 세부 규정 — CoinCraft' };

const SECTIONS = [
  {
    title: '응시 자격',
    items: [
      'CoinCraft 회원 가입 후 응시 가능합니다.',
      'Basic 시험: 별도 사전 요건 없음.',
      'Associate 시험: 지정 사전 수강 강좌 완료 필요 (해당 시험에 명시).',
      'Expert 시험: Associate 이상 자격증 보유자에 한함.',
    ],
  },
  {
    title: '응시료 및 결제',
    items: [
      '시험별 응시료가 상이하며, 결제 후 응시 가능합니다.',
      '결제 후 응시권은 즉시 활성화됩니다.',
      '결제 취소는 응시 시작 전에만 가능합니다.',
      '시험 시작 후 환불은 불가합니다.',
    ],
  },
  {
    title: '시험 환경 및 규정',
    items: [
      '온라인 브라우저 환경에서 응시합니다.',
      '시험 시작 후 다른 탭/창으로 전환이 3회 감지되면 자동 제출됩니다.',
      '시험 중 복사(Ctrl+C), 붙여넣기(Ctrl+V), 우클릭이 제한됩니다.',
      '제한 시간 종료 시 자동으로 제출 처리됩니다.',
      '부정행위 적발 시 응시 자격이 영구 박탈될 수 있습니다.',
    ],
  },
  {
    title: '채점 및 합격 기준',
    items: [
      '제출 즉시 자동 채점됩니다.',
      '합격 기준 점수 이상 획득 시 합격 처리됩니다 (시험별 상이).',
      '불합격 시 재응시는 응시료 재결제 후 가능합니다.',
      '합격 점수와 문항별 피드백이 결과 페이지에서 제공됩니다.',
    ],
  },
  {
    title: '자격증 발급 및 유효성',
    items: [
      '합격 즉시 고유 자격증 번호가 발급됩니다.',
      '자격증은 /verify/[자격증번호] URL로 공개 검증이 가능합니다.',
      '현재 발급되는 자격증은 영구 유효합니다 (향후 변경 시 사전 공지).',
      '자격증은 마이페이지 > 내 자격증에서 확인할 수 있습니다.',
    ],
  },
  {
    title: '유의사항',
    items: [
      '시험 문제 및 정답을 외부에 공유하는 행위는 금지됩니다.',
      '동일 시험 재응시 횟수에는 제한이 없으나 매 회 응시료가 발생합니다.',
      '시스템 오류로 인한 시험 중단 발생 시 고객센터로 문의해 주세요.',
      '시험 문제 오류 신고는 결과 확인 후 7일 이내에 접수해 주세요.',
    ],
  },
];

export default function CertExamRulesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl">
          {/* Back */}
          <Link
            href="/cert"
            className="text-sm text-cc-muted hover:text-cc-accent transition-colors mb-6 inline-block"
          >
            ← 자격 검정 안내로
          </Link>

          <div className="mb-10">
            <p className="cc-label mb-2">CERTIFICATION</p>
            <h1 className="text-3xl font-bold text-cc-text">시험 관리 세부 규정</h1>
            <p className="text-cc-muted mt-2 text-sm">
              최종 개정: 2025년 1월 1일
            </p>
          </div>

          <div className="space-y-8">
            {SECTIONS.map((sec) => (
              <div
                key={sec.title}
                className="bg-cc-secondary border border-white/10 rounded-cc p-6"
              >
                <h2 className="text-cc-text font-semibold text-lg mb-4">{sec.title}</h2>
                <ul className="space-y-2">
                  {sec.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-cc-muted leading-relaxed">
                      <span className="text-cc-accent mt-0.5 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center space-y-3">
            <p className="text-cc-muted text-sm">규정 관련 문의는 고객센터로 연락해 주세요.</p>
            <Link
              href="/exams"
              className="inline-block px-6 py-3 bg-cc-accent text-[#1a1a2e] font-bold rounded-cc hover:opacity-90 transition-opacity"
            >
              시험 목록 보기
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
