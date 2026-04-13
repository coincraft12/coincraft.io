export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-cc-primary">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,166,35,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cc-accent/5 blur-3xl pointer-events-none" />

      <div className="cc-container relative z-10 py-32">
        <div className="max-w-3xl">
          <p className="cc-label mb-4">Web3 · Blockchain · Education</p>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-cc-text">
            블록체인의 구조를<br />
            <span className="text-cc-accent">설계하는 사람들</span>
          </h1>
          <p className="text-lg text-cc-muted mb-10 leading-relaxed">
            CoinCraft는 Web3 아키텍처 교육, 온체인 분석, Custody 시스템 설계,<br className="hidden md:block" />
            특허 전략을 통해 블록체인 산업의 전문가를 양성합니다.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="/courses" className="cc-btn cc-btn-primary">
              강의 보기
            </a>
            <a href="#about" className="cc-btn cc-btn-ghost">
              더 알아보기
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
