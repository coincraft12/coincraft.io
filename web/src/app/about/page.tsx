import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = {
  title: 'About — COINCRAFT',
  description: 'COINCRAFT는 AI 에이전트가 실제 경제에서 작동할 때 필요한 신뢰 구조를 설계하는 Web3 전문 조직입니다.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-3xl">
          <div className="mb-12">
            <p className="cc-label mb-2">ABOUT COINCRAFT</p>
            <h1 className="text-4xl md:text-5xl font-bold text-cc-text mb-6">
              우리는 <span className="text-cc-accent">무엇을</span> 만드는가
            </h1>
            <p className="text-cc-muted text-lg leading-relaxed">
              COINCRAFT는 블록체인을 단순히 가르치는 것을 넘어,
              AI 에이전트가 실제 경제에서 작동할 때 필요한
              신뢰 구조를 설계하는 Web3 전문 조직입니다.
            </p>
          </div>

          <div className="space-y-8">
            <section className="cc-glass p-8">
              <h2 className="text-xl font-bold text-cc-text mb-4">미션</h2>
              <p className="text-cc-muted leading-relaxed">
                AI와 Web3가 교차하는 지점에서, 실제로 작동하는 신뢰 시스템을 설계한다.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-xl font-bold text-cc-text mb-4">비전</h2>
              <p className="text-cc-muted leading-relaxed">
                Web3 구조설계와 AI 신뢰 인프라의 표준을 만드는 전문 기관.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-xl font-bold text-cc-text mb-4">5대 전략 트랙</h2>
              <ul className="space-y-3 text-cc-muted">
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">출판</strong> — 리서치와 전문 지식을 콘텐츠로 상품화. 온체인 분석 리포트, 기술 보고서, 단행본 출판</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">아카데미</strong> — Web3 구조설계 전문가 양성을 위한 단계별 강의 커리큘럼</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">리서치</strong> — 온체인 데이터 분석과 AI×Web3 연구. 현장에서 검증된 인사이트를 지식으로 생산</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">WEB3 인증</strong> — Basic · Associate · Expert 단계별 Web3 구조설계 공식 자격 검정 시스템</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">설계</strong> — AI 에이전트가 실제 경제에서 작동할 때 필요한 신원·보안·실행·책임 구조 설계</span>
                </li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-xl font-bold text-cc-text mb-4">자격 인증 체계</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { level: 'Basic', color: 'text-emerald-400', desc: '블록체인 기초 이해 및 Web3 생태계 파악' },
                  { level: 'Associate', color: 'text-blue-400', desc: '스마트컨트랙트 설계 및 DeFi 아키텍처 구현' },
                  { level: 'Expert', color: 'text-purple-400', desc: '엔터프라이즈 블록체인 시스템 총괄 설계' },
                ].map((item) => (
                  <div key={item.level} className="p-4 border border-white/10 rounded-cc">
                    <p className={`text-sm font-bold mb-2 ${item.color}`}>{item.level}</p>
                    <p className="text-xs text-cc-muted">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
