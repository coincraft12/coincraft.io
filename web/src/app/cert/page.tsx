import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = { title: 'WEB3 구조 설계자 검정 — COINCRAFT' };
export const revalidate = 60;

async function fetchExamCapacity(): Promise<{
  registeredCount: number;
  maxCapacity: number | null;
  registrationStart: string | null;
  registrationEnd: string | null;
} | null> {
  try {
    const apiBase = process.env.API_INTERNAL_URL ?? '';
    const res = await fetch(`${apiBase}/api/v1/exams`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const exams: Array<{
      level: string;
      registeredCount: number;
      maxCapacity: number | null;
      registrationStart: string | null;
      registrationEnd: string | null;
    }> = json.data ?? [];
    const basic = exams.find((e) => e.level === 'basic');
    return basic ? {
      registeredCount: basic.registeredCount,
      maxCapacity: basic.maxCapacity,
      registrationStart: basic.registrationStart ?? null,
      registrationEnd: basic.registrationEnd ?? null,
    } : null;
  } catch {
    return null;
  }
}

function formatRegPeriod(start: string | null, end: string | null): string {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const days = ['일','월','화','수','목','금','토'];
  return `${s.getFullYear()}년 ${fmt(s)}(${days[s.getDay()]}) ~ ${fmt(e)}(${days[e.getDay()]})`;
}

const LEVELS = [
  {
    key: 'basic',
    label: 'Basic',
    available: true,
    desc: '중앙화 구조와 분산 신뢰 구조의 차이를 설명하고, 지갑·주소·트랜잭션 등 기본 요소를 이해하여 WEB3 구조를 읽을 수 있다.',
    eligibility: '응시 자격: 제한 없음',
  },
  {
    key: 'associate',
    label: 'Associate',
    available: false,
    desc: '서비스/프로젝트의 구조를 WEB3 관점에서 해석하고, 사용자 온보딩·자산흐름·권한/책임 구조를 점검하여 위험요소를 식별할 수 있다.',
    eligibility: '응시 자격: Basic 취득자',
  },
  {
    key: 'professional',
    label: 'Professional',
    available: false,
    desc: '목표에 맞춰 WEB3 구조를 설계·개선하고, 핵심 리스크를 통제하는 설계안을 제시할 수 있다.',
    eligibility: '응시 자격: Associate 취득자',
  },
];

const INFO_LINKS = [
  {
    href: '/cert/apply',
    title: '검정 신청 안내',
    desc: '수험료 납부 방법, 신청 폼, 유의사항',
  },
  {
    href: '/cert/policy',
    title: '자격 관리·운영 규정',
    desc: '등급 체계, 검정 기준, 합격 기준, 자격증 교부',
  },
  {
    href: '/cert/exam-rules',
    title: '시험 관리 세부 규정',
    desc: '부정행위 처리, 이의신청, 환불, 개인정보 보관',
  },
];

export default async function CertPage() {
  const capacity = await fetchExamCapacity();
  const isFull = capacity?.maxCapacity != null && capacity.registeredCount >= capacity.maxCapacity;
  const remaining = capacity?.maxCapacity != null ? capacity.maxCapacity - capacity.registeredCount : null;
  const regPeriod = formatRegPeriod(capacity?.registrationStart ?? null, capacity?.registrationEnd ?? null)
    || '2026년 4월 20일(월) ~ 4월 26일(일)';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-2xl">

          {/* 자격 배지 */}
          <p className="text-center mb-3">
            <span className="inline-block bg-[#0a2463] text-white text-xs px-4 py-1 rounded-full tracking-wide">
              과학기술정보통신부 주무부처 · 정부 등록 민간자격 · 등록번호 2026-002589
            </span>
          </p>

          {/* 타이틀 */}
          <h1 className="text-center text-3xl md:text-4xl font-extrabold text-cc-text mt-4 mb-2">
            WEB3 구조 설계자 검정
          </h1>
          <p className="text-center text-cc-muted mb-5">COINCRAFT 주관 | 주식회사 코인크래프트</p>
          <p className="text-center text-base font-bold text-[#93b4ff] leading-relaxed mb-12">
            블록체인과 WEB3를 이해하는 수준을 넘어,<br />
            구조를 읽고 판단할 수 있는 사람을 검증합니다.
          </p>

          {/* 소개 문구 */}
          <div className="mb-12 space-y-4 text-sm text-cc-muted leading-relaxed">
            <p>
              WEB3 구조 설계자 검정은 지갑, 주소, 트랜잭션, 스마트컨트랙트, 토큰 등 WEB3의 핵심 요소를 단편적으로 아는 수준이 아니라,
              각 요소가 어떤 구조로 연결되고 어떤 책임과 위험을 만드는지까지 읽어낼 수 있는 역량을 검증하는 자격입니다.
            </p>
            <p>
              본 검정은 <strong className="text-cc-text">과학기술정보통신부를 주무부처로 하는 정부 등록 민간자격</strong>으로,
              단순 암기보다 <strong className="text-cc-text">구조 이해, 해석, 판단 능력</strong>을 중심으로 평가합니다.
              합격자에게는 등록 민간자격 인증서가 발급되며, 향후 온체인 기반 검증 체계로도 확장될 예정입니다.
            </p>
          </div>

          {/* 정부 등록증 이미지 */}
          <div className="mb-12 text-center">
            <p className="text-sm font-bold text-cc-text mb-3">정부 등록 민간자격 등록증</p>
            <a href="https://coincraft.io/wp-content/uploads/2026/04/cert.png" target="_blank" rel="noreferrer">
              <img
                src="https://coincraft.io/wp-content/uploads/2026/04/cert.png"
                alt="WEB3 구조 설계자 민간자격 등록증"
                className="max-w-full mx-auto rounded-xl border border-white/10 shadow-lg"
              />
            </a>
            <p className="mt-2 text-xs text-cc-muted">주무부처: 과학기술정보통신부 · 등록번호 2026-002589</p>
          </div>

          {/* 등급 체계 */}
          <h2 className="text-xl font-bold text-cc-text mb-4">등급 체계</h2>
          <div className="space-y-3 mb-12">
            {LEVELS.map((lv) => (
              <div
                key={lv.key}
                className={`border border-white/10 rounded-xl p-5 ${!lv.available ? 'opacity-60' : ''} bg-cc-secondary`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#0a2463] text-white text-xs px-3 py-0.5 rounded-full font-bold">
                    {lv.label}
                  </span>
                  {!lv.available && (
                    <span className="text-xs text-cc-muted">준비 중</span>
                  )}
                </div>
                <p className="text-sm text-cc-muted leading-relaxed mb-1">{lv.desc}</p>
                <p className="text-xs text-cc-muted">{lv.eligibility}</p>
              </div>
            ))}
          </div>

          {/* 현재 진행 중인 검정 */}
          <h2 className="text-xl font-bold text-cc-text mb-4">현재 진행 중인 검정</h2>
          <div className="bg-cc-secondary border border-white/10 rounded-xl p-6 mb-12">
            <p className="text-base font-bold text-cc-text mb-4">Basic 1회차 검정</p>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-24 text-cc-muted shrink-0">접수 기간</span>
                <span className="font-semibold text-cc-text">{regPeriod}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-cc-muted shrink-0">시험일</span>
                <span className="font-semibold text-cc-text">2026년 5월 2일(토) 오후 2시</span>
              </div>
              <div className="flex">
                <span className="w-24 text-cc-muted shrink-0">수험료</span>
                <div className="flex items-center gap-2">
                  <span className="text-cc-muted line-through text-sm">60,000원</span>
                  <span className="font-semibold text-cc-accent">30,000원</span>
                  <span className="text-xs font-bold text-red-400">50%</span>
                </div>
              </div>
              {capacity?.maxCapacity != null && (
                <div className="flex">
                  <span className="w-24 text-cc-muted shrink-0">접수 현황</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${isFull ? 'text-red-400' : 'text-cc-text'}`}>
                      {capacity.registeredCount} / {capacity.maxCapacity}명
                    </span>
                    {isFull ? (
                      <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">마감</span>
                    ) : remaining !== null && remaining <= 5 ? (
                      <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">잔여 {remaining}석</span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 text-center">
              {isFull ? (
                <div className="inline-block bg-white/10 text-cc-muted text-sm font-bold px-10 py-3.5 rounded-lg cursor-not-allowed">
                  접수 마감
                </div>
              ) : (
                <Link
                  href="/cert/apply"
                  className="inline-block bg-[#0a2463] text-white text-sm font-bold px-10 py-3.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  검정 신청하기
                </Link>
              )}
            </div>
          </div>

          {/* 안내 및 규정 링크 */}
          <h2 className="text-xl font-bold text-cc-text mb-4">안내 및 규정</h2>
          <div className="space-y-3 mb-12">
            {INFO_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block no-underline">
                <div className="border border-white/10 rounded-xl p-5 flex items-center justify-between bg-cc-secondary hover:border-cc-accent/40 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-cc-text mb-0.5">{link.title}</p>
                    <p className="text-xs text-cc-muted">{link.desc}</p>
                  </div>
                  <span className="text-cc-muted text-lg ml-4">›</span>
                </div>
              </Link>
            ))}
          </div>

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

        </div>
      </main>
      <Footer />
    </>
  );
}
