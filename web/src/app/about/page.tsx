import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export const metadata = {
  title: 'About — CoinCraft',
  description: 'CoinCraft는 Web3 아키텍처 교육, 온체인 분석, Custody 시스템 설계, 특허 전략을 통해 블록체인 산업의 전문가를 양성합니다.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-3xl">
          <div className="mb-12">
            <p className="cc-label mb-2">ABOUT</p>
            <h1 className="text-4xl md:text-5xl font-bold text-cc-text mb-6">CoinCraft란?</h1>
            <p className="text-cc-muted text-lg leading-relaxed">
              CoinCraft는 블록체인의 구조를 설계하는 사람들을 위한 전문 교육 플랫폼입니다.
            </p>
          </div>

          <div className="space-y-8">
            <section className="cc-glass p-8">
              <h2 className="text-xl font-bold text-cc-text mb-4">미션</h2>
              <p className="text-cc-muted leading-relaxed">
                우리는 Web3 기술의 본질을 이해하고, 블록체인 시스템을 직접 설계·구현할 수 있는
                진정한 전문가를 양성합니다. 단순한 트렌드 추종이 아닌, 시스템 아키텍처 수준의
                깊은 이해를 목표로 합니다.
              </p>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-xl font-bold text-cc-text mb-4">주요 트랙</h2>
              <ul className="space-y-3 text-cc-muted">
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">WEB3 Architect Track</strong> — 블록체인 아키텍처 설계 전문가 양성</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">온체인 분석</strong> — 체인 데이터 해석 및 투자 인사이트 도출</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">Custody 설계</strong> — 디지털 자산 수탁 시스템 아키텍처</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cc-accent mt-0.5">▸</span>
                  <span><strong className="text-cc-text">특허 전략</strong> — 블록체인 기술 IP 확보 및 출원 전략</span>
                </li>
              </ul>
            </section>

            <section className="cc-glass p-8">
              <h2 className="text-xl font-bold text-cc-text mb-4">자격증 체계</h2>
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
