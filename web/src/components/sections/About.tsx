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
              COINCRAFT는 블록체인을 단순히 가르치는 것을 넘어,
              AI 에이전트가 실제 경제에서 작동할 때 필요한
              신뢰 구조를 설계하는 Web3 전문 조직입니다.
            </p>
            <p className="text-cc-muted leading-relaxed mb-10">
              출판·아카데미·리서치·WEB3 인증·설계,
              다섯 개의 트랙을 동시에 전진하며
              블록체인 산업의 지식 기반을 만들어갑니다.
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
                AI와 Web3가 교차하는 지점에서, 실제로 작동하는 신뢰 시스템을 설계한다.
              </p>
            </div>
            <div className="cc-glass p-6">
              <div className="text-2xl mb-3">🔭</div>
              <h3 className="text-lg font-bold text-cc-text mb-2">비전</h3>
              <p className="text-cc-muted leading-relaxed">
                Web3 구조설계와 AI 신뢰 인프라의 표준을 만드는 전문 기관.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
