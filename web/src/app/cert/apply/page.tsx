import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = { title: '검정 신청 — CoinCraft' };
export const revalidate = 60;

async function fetchExamCapacity(): Promise<{ registeredCount: number; maxCapacity: number | null } | null> {
  try {
    const apiBase = process.env.API_INTERNAL_URL ?? '';
    const res = await fetch(`${apiBase}/api/v1/exams`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const exams: Array<{ level: string; registeredCount: number; maxCapacity: number | null }> = json.data ?? [];
    const basic = exams.find((e) => e.level === 'basic');
    return basic ? { registeredCount: basic.registeredCount, maxCapacity: basic.maxCapacity } : null;
  } catch {
    return null;
  }
}

const SCHEDULE = [
  { label: '시험일', value: '2026년 5월 2일 (토)' },
  { label: '접수 기간', value: '4월 14일(월) ~ 4월 20일(일)' },
  { label: '수험료', value: null },
  { label: '응시 자격', value: '제한 없음' },
  { label: '합격 기준', value: '100점 만점 · 70점 이상' },
  { label: '시험 방식', value: '온라인 · 객관식 40문항 · 60분' },
];

const SUBJECTS = [
  {
    name: '과목 1 · 분산 신뢰 구조의 이해',
    count: '15문항',
    topics: '중앙화 신뢰 구조 / 단일 기록 구조 / 권한 집중 구조 / 분산 신뢰 3층 구조 / 블록체인 기본 정의',
  },
  {
    name: '과목 2 · WEB3 기초 구조의 이해',
    count: '25문항',
    topics: '키 기반 소유권 / 트랜잭션 구조 / 지갑 / 주소 / 트랜잭션 결과 / 가스 / 스마트컨트랙트 / 토큰 / 기본 시나리오 구조 해석 / 기본 위험요소 분류 / 기본 점검 체크리스트',
  },
];

const EXAM_FLOW = [
  { label: '시험 링크 발송', value: '시험 당일 오전 9시, 등록 이메일로 개별 발송' },
  { label: '응시 시간', value: '오후 2시 일제 시작 / 60분 / 오후 3시 종료' },
  { label: '응시 환경', value: 'PC 또는 모바일 / 인터넷 연결 필요' },
  { label: '유의사항', value: '자료 참고 금지 / 재응시 불가 / 본인 확인 후 응시' },
  { label: '결과 발표', value: '제출 즉시 점수 및 정답 확인 가능 / 합격자 인증서는 이메일 발송' },
];

export default async function CertApplyPage() {
  const capacity = await fetchExamCapacity();
  const isFull = capacity?.maxCapacity != null && capacity.registeredCount >= capacity.maxCapacity;
  const remaining = capacity?.maxCapacity != null ? capacity.maxCapacity - capacity.registeredCount : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl">

          {/* 브레드크럼 */}
          <p className="text-xs text-cc-muted mb-6">
            <Link href="/cert" className="text-cc-muted hover:text-cc-accent transition-colors">검정 홈</Link>
            {' › '}검정 신청 안내
          </p>

          {/* 타이틀 */}
          <p className="text-center mb-3">
            <span className="inline-block bg-[#0a2463] text-white text-xs px-4 py-1 rounded-full tracking-wide">
              과학기술정보통신부 주무부처 · 정부 등록 민간자격 · 등록번호 2026-002589
            </span>
          </p>
          <h1 className="text-center text-2xl font-extrabold text-cc-text mb-1">
            WEB3 구조 설계자 검정
          </h1>
          <p className="text-center text-cc-muted text-sm mb-10">Basic · 1회차</p>

          {/* 핵심 일정 카드 */}
          <div className="bg-cc-secondary border border-white/10 rounded-xl px-7 py-6 mb-10">
            <div className="space-y-2">
              {SCHEDULE.map(({ label, value }) => (
                <div key={label} className="flex text-sm">
                  <span className="w-28 text-cc-muted shrink-0">{label}</span>
                  {value === null ? (
                    <div className="flex items-center gap-2">
                      <span className="text-cc-muted line-through">60,000원</span>
                      <span className="font-semibold text-cc-accent">30,000원</span>
                      <span className="text-xs font-bold text-red-400">50%</span>
                    </div>
                  ) : (
                    <span className="font-semibold text-cc-text">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 검정 과목 */}
          <h2 className="text-lg font-bold text-cc-text mb-4">검정 과목</h2>
          <div className="space-y-3 mb-10">
            {SUBJECTS.map((subj) => (
              <div key={subj.name} className="border border-white/10 rounded-xl p-5 bg-cc-secondary">
                <p className="text-xs font-bold text-[#93b4ff] mb-1">{subj.name} — {subj.count}</p>
                <p className="text-sm text-cc-muted leading-relaxed">{subj.topics}</p>
              </div>
            ))}
          </div>

          {/* 1회 특별 혜택 */}
          <div className="bg-cc-secondary border border-[#0a2463] rounded-xl p-5 mb-10">
            <p className="text-sm font-extrabold text-[#93b4ff] tracking-wide mb-2">1회 검정 신청자 특별 혜택</p>
            <p className="text-sm text-cc-text leading-relaxed">
              결제 확인 후 <strong>16챕터 강의 자료 PDF 전원 무료 제공</strong>
            </p>
            <p className="text-xs text-cc-muted mt-1">
              WEB3 구조 설계자 Basic 전 범위 학습 자료 · 4월 21일 일괄 이메일 배포
            </p>
          </div>

          {/* 신청 방법 */}
          <h2 className="text-lg font-bold text-cc-text mb-4">신청 방법</h2>
          <ol className="text-sm text-cc-muted leading-relaxed list-decimal pl-5 space-y-2 mb-4">
            <li>검정 신청 버튼을 눌러 신청서를 작성합니다.</li>
            <li>신청서 제출 후 안내되는 결제 페이지에서 수험료 결제를 진행합니다.</li>
            <li>결제 확인 후 등록 이메일로 수험번호와 학습 자료 PDF가 발송됩니다.</li>
            <li>시험 당일 오전, 등록 이메일로 발송된 시험 링크를 통해 응시합니다.</li>
          </ol>
          <div className="bg-cc-secondary border border-white/10 rounded-xl p-4 mb-8 text-xs text-cc-muted leading-relaxed">
            신청 완료 후에는 결제 확인 및 시험 안내가 모두 등록 이메일 기준으로 진행됩니다.
            신청서에 입력한 이메일을 정확하게 확인해 주세요.
          </div>

          {/* 신청 버튼 */}
          <div className="text-center mb-10">
            {capacity?.maxCapacity != null && (
              <p className={`text-sm mb-3 font-semibold ${isFull ? 'text-red-400' : remaining !== null && remaining <= 5 ? 'text-orange-400' : 'text-cc-muted'}`}>
                {isFull
                  ? '접수 정원이 마감되었습니다.'
                  : remaining !== null && remaining <= 5
                  ? `잔여 ${remaining}석 — 마감 임박`
                  : `현재 ${capacity.registeredCount}명 접수 완료 / 총 ${capacity.maxCapacity}명 정원`}
              </p>
            )}
            {isFull ? (
              <div className="inline-block bg-white/10 text-cc-muted text-base font-bold px-12 py-4 rounded-lg cursor-not-allowed">
                접수 마감
              </div>
            ) : (
              <a
                href="/cert/register/"
                className="inline-block bg-[#0a2463] text-white text-base font-bold px-12 py-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                검정 신청하기
              </a>
            )}
          </div>

          {/* 환불 정책 */}
          <h2 className="text-lg font-bold text-cc-text mb-3">환불 정책</h2>
          <p className="text-sm text-cc-muted leading-relaxed mb-10">
            시험일 7일 전(4월 25일)까지 전액 환불 가능합니다.<br />
            이후 환불은 불가합니다.
          </p>

          {/* 시험 진행 방식 */}
          <h2 className="text-lg font-bold text-cc-text mb-4">시험 진행 방식</h2>
          <div className="bg-cc-secondary border border-white/10 rounded-xl px-6 py-5 mb-10">
            <p className="text-sm font-bold text-cc-text mb-4">온라인 시험 (오프라인 시험장 없음)</p>
            <div className="space-y-2">
              {EXAM_FLOW.map(({ label, value }) => (
                <div key={label} className="flex text-sm">
                  <span className="w-32 text-cc-muted shrink-0">{label}</span>
                  <span className="text-cc-muted">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 인증서 안내 */}
          <h2 className="text-lg font-bold text-cc-text mb-3">합격 인증서</h2>
          <p className="text-sm text-cc-muted leading-relaxed mb-12">
            합격자에게는 <strong className="text-cc-text">WEB3 구조 설계자 Basic</strong> 인증서가 발급됩니다.<br />
            인증서는 이메일로 전송되며, 향후 온체인 기록 기반 검증 시스템으로 단계적으로 확장됩니다.
          </p>

          {/* 문의 */}
          <div className="text-center text-sm text-cc-muted space-y-2">
            <p>
              문의:{' '}
              <a href="mailto:coincraft.edu@gmail.com" className="text-cc-accent hover:underline">
                coincraft.edu@gmail.com
              </a>
            </p>
            <p>
              <a
                href="http://pf.kakao.com/_xhPxdxgn/chat"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-1 bg-[#FEE500] text-[#3A1D1D] text-sm font-bold px-7 py-2.5 rounded-md hover:opacity-90 transition-opacity"
              >
                카카오톡 빠른 상담
              </a>
            </p>
          </div>

          {/* 하단 링크 */}
          <div className="border-t border-white/10 pt-6 mt-10 flex flex-wrap gap-4">
            <Link href="/cert" className="text-sm text-cc-accent hover:underline">← 검정 홈으로</Link>
            <Link href="/cert/policy" className="text-sm text-cc-accent hover:underline">자격 관리·운영 규정 →</Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
