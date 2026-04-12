const stats = [
  { num: '7+', label: '강의 커리큘럼' },
  { num: '3+', label: '출원 특허' },
  { num: '2026', label: '운영 시작' },
]

export default function About() {
  return (
    <section id="about" className="cc-section bg-cc-secondary/30">
      <div className="cc-container">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Text */}
          <div>
            <p className="cc-label mb-3">ABOUT COINCRAFT</p>
            <h2 className="text-4xl font-bold mb-6 text-cc-text">
              우리는 <span className="text-cc-accent">무엇을</span> 만드는가
            </h2>
            <p className="text-cc-text text-lg leading-relaxed mb-4">
              CoinCraft는 블록체인 기술을 단순히 가르치는 것을 넘어,
              실제 산업에서 작동하는 시스템을 설계하고 특허화하는
              Web3 전문 조직입니다.
            </p>
            <p className="text-cc-muted leading-relaxed mb-10">
              Sharon과 AI가 함께하는 단일 팀 구조로,
              교육·콘텐츠·특허·Custody 시스템·온체인 분석
              다섯 가지 트랙을 동시에 운영합니다.
            </p>
            <div className="flex gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold text-cc-accent">{s.num}</div>
                  <div className="text-sm text-cc-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mission cards */}
          <div className="flex flex-col gap-4">
            <div className="cc-glass p-6">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-cc-text mb-2">미션</h3>
              <p className="text-cc-muted leading-relaxed">
                블록체인 전문가가 실무에서 즉시 활용할 수 있는 지식과 시스템을 제공한다.
              </p>
            </div>
            <div className="cc-glass p-6">
              <div className="text-2xl mb-3">🔭</div>
              <h3 className="text-lg font-bold text-cc-text mb-2">비전</h3>
              <p className="text-cc-muted leading-relaxed">
                Web3 구조설계의 표준을 만드는 글로벌 전문 기관.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
