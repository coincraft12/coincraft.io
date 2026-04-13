const courses = [
  {
    id: 1,
    title: '스마트컨트랙트 개발 입문',
    excerpt: 'Solidity 기초부터 ERC-20 토큰 구현까지. Hardhat 개발환경, SimpleBank, KRWCoin 실습 포함.',
    href: '/courses/smart-contract-dev',
    level: 'Basic',
    levelCls: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: 2,
    title: 'Web3 Architect Track — Basic',
    excerpt: 'Web3 아키텍처의 핵심 개념을 체계적으로 학습. 블록체인 구조부터 DApp 설계까지.',
    href: '/courses/web3-architect-basic',
    level: 'Basic',
    levelCls: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: 3,
    title: 'Custody 시스템 설계',
    excerpt: '기업용 수탁형 지갑 아키텍처. 멀티체인 어댑터, 정책 엔진, 보안 설계 실무.',
    href: '/courses/custody-design',
    level: 'Associate',
    levelCls: 'bg-blue-500/20 text-blue-400',
  },
]

export default function Academy() {
  return (
    <section id="academy" className="cc-section bg-cc-secondary/30">
      <div className="cc-container">
        <div className="mb-16">
          <p className="cc-label mb-3">ACADEMY</p>
          <h2 className="text-4xl font-bold text-cc-text mb-3">
            Web3 <span className="text-cc-accent">온라인 강좌</span>
          </h2>
          <p className="text-cc-muted">실무 중심의 단계별 커리큘럼으로 Web3 전문가로 성장하세요.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {courses.map((c) => (
            <a
              key={c.id}
              href={c.href}
              className="cc-glass hover:border-cc-accent/40 transition-all duration-300 group block overflow-hidden"
            >
              {/* 썸네일 플레이스홀더 */}
              <div className="relative h-44 bg-cc-accent/5 overflow-hidden flex items-center justify-center">
                <span className="text-5xl opacity-20">🎓</span>
                <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full ${c.levelCls} backdrop-blur-sm`}>
                  {c.level}
                </span>
              </div>

              {/* 내용 */}
              <div className="p-6">
                <h3 className="text-base font-bold text-cc-text mb-2 group-hover:text-cc-accent transition-colors leading-snug">
                  {c.title}
                </h3>
                <p className="text-cc-muted text-sm leading-relaxed mb-4 line-clamp-2">
                  {c.excerpt}
                </p>
                <span className="text-cc-accent text-sm font-semibold">자세히 보기 →</span>
              </div>
            </a>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <a href="/courses" className="cc-btn cc-btn-primary">
            전체 강의 보기
          </a>
          <a href="/cert" className="cc-btn cc-btn-outline">
            자격 검정 안내
          </a>
        </div>
      </div>
    </section>
  )
}
