import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Badge from '@/components/ui/Badge';

export const metadata = { title: '자격 검정 — CoinCraft' };

const LEVELS = [
  {
    key: 'basic',
    label: 'Basic',
    variant: 'basic' as const,
    desc: '블록체인 핵심 개념과 Web3 생태계 기초를 검증합니다.',
    topics: ['블록체인 원리', '암호화폐 기초', 'DeFi 개요', 'NFT & 토큰 이코노미'],
    target: '블록체인 입문자 / 투자자',
  },
  {
    key: 'associate',
    label: 'Associate',
    variant: 'associate' as const,
    desc: '스마트 컨트랙트, 온체인 분석, DeFi 프로토콜 심화 역량을 검증합니다.',
    topics: ['스마트 컨트랙트', '온체인 분석', 'DeFi 프로토콜', 'Layer 2 & 브릿지'],
    target: '개발자 / 애널리스트',
  },
  {
    key: 'expert',
    label: 'Expert',
    variant: 'expert' as const,
    desc: '블록체인 아키텍처 설계, 보안, 고급 프로토콜 이해를 검증합니다.',
    topics: ['아키텍처 설계', '보안 & 감사', '거버넌스', 'Cross-chain'],
    target: '시니어 개발자 / 컨설턴트',
  },
];

const BENEFITS = [
  { icon: '🏆', title: '공식 자격증 발급', desc: '고유 자격증 번호와 공개 검증 링크 제공' },
  { icon: '🔍', title: '온라인 검증', desc: '누구나 verify 링크로 진위 확인 가능' },
  { icon: '📈', title: '경력 증빙', desc: 'LinkedIn 등 프로필에 자격증 번호 기재 가능' },
  { icon: '🎓', title: '3단계 성장 트랙', desc: 'Basic → Associate → Expert 단계적 역량 개발' },
];

export default function CertPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">

          {/* Hero */}
          <div className="mb-16 text-center">
            <p className="cc-label mb-2">CERTIFICATION</p>
            <h1 className="text-3xl md:text-5xl font-bold text-cc-text mb-6">
              CoinCraft 자격 검정
            </h1>
            <p className="text-cc-muted max-w-2xl mx-auto text-lg leading-relaxed">
              블록체인·Web3 전문성을 공식 자격증으로 증명하세요.
              Basic부터 Expert까지 3단계 트랙으로 역량을 체계적으로 검증합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link
                href="/exams"
                className="px-6 py-3 bg-cc-accent text-[#1a1a2e] font-bold rounded-cc hover:opacity-90 transition-opacity"
              >
                시험 목록 보기
              </Link>
              <Link
                href="/cert/exam-rules"
                className="px-6 py-3 border border-white/20 text-cc-muted rounded-cc hover:border-cc-accent/40 hover:text-cc-accent transition-colors"
              >
                시험 규정 확인
              </Link>
            </div>
          </div>

          {/* Level overview */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-cc-text mb-8 text-center">3단계 자격 트랙</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LEVELS.map((lv) => (
                <div key={lv.key} className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={lv.variant}>{lv.label}</Badge>
                    <span className="text-xs text-cc-muted">{lv.target}</span>
                  </div>
                  <p className="text-cc-muted text-sm leading-relaxed">{lv.desc}</p>
                  <ul className="space-y-1.5">
                    {lv.topics.map((t) => (
                      <li key={t} className="flex items-center gap-2 text-sm text-cc-muted">
                        <span className="text-cc-accent">✓</span> {t}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/exams"
                    className="block w-full text-center px-4 py-2 text-sm border border-white/20 text-cc-muted rounded hover:border-cc-accent/40 hover:text-cc-accent transition-colors"
                  >
                    {lv.label} 시험 보기 →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-cc-text mb-8 text-center">자격증 혜택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="bg-cc-secondary border border-white/10 rounded-cc p-6 text-center space-y-3">
                  <div className="text-3xl">{b.icon}</div>
                  <p className="text-cc-text font-semibold">{b.title}</p>
                  <p className="text-cc-muted text-sm">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Process */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-cc-text mb-8 text-center">응시 절차</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
              {[
                { step: '01', title: '시험 선택', desc: '레벨에 맞는 시험 선택' },
                { step: '02', title: '응시권 결제', desc: '유료 시험 응시권 구매' },
                { step: '03', title: '시험 응시', desc: '온라인 시험 응시 (시간 제한)' },
                { step: '04', title: '자격증 발급', desc: '합격 즉시 자격증 발급' },
              ].map((p, i) => (
                <div key={p.step} className="flex flex-col sm:flex-row items-center">
                  <div className="flex-1 bg-cc-secondary border border-white/10 rounded-cc p-6 text-center space-y-2">
                    <p className="text-cc-accent font-mono font-bold text-lg">{p.step}</p>
                    <p className="text-cc-text font-semibold">{p.title}</p>
                    <p className="text-cc-muted text-sm">{p.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="text-cc-muted text-xl px-2 hidden sm:block">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-cc-secondary border border-white/10 rounded-cc p-10 space-y-4">
            <h2 className="text-2xl font-bold text-cc-text">지금 바로 시작하세요</h2>
            <p className="text-cc-muted">CoinCraft Basic 자격증으로 Web3 커리어를 시작하세요.</p>
            <Link
              href="/exams"
              className="inline-block px-8 py-3.5 bg-cc-accent text-[#1a1a2e] font-bold rounded-cc hover:opacity-90 transition-opacity"
            >
              시험 목록 보기 →
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
