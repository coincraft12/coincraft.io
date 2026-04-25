const posts = [
  {
    id: 1,
    title: 'ERC-20 vs TRC-20 — 두 토큰 표준의 기술적 차이',
    excerpt: '이더리움과 TRON의 토큰 표준을 ABI 인코딩, 수수료 구조, 트랜잭션 만료 메커니즘 측면에서 비교 분석합니다.',
    href: '/blog/erc20-vs-trc20',
    date: '2026.04.13',
  },
  {
    id: 2,
    title: 'Custody 시스템 설계: UTXO 모델과 Account 모델의 선택',
    excerpt: 'Bitcoin의 UTXO 모델과 Ethereum의 Account 모델은 수탁 시스템 설계에 전혀 다른 접근을 요구합니다.',
    href: '/blog/custody-utxo-vs-account',
    date: '2026.04.10',
  },
  {
    id: 3,
    title: '스마트컨트랙트 보안: 재진입 공격 완전 정복',
    excerpt: 'CEI 패턴과 ReentrancyGuard를 통해 재진입 공격을 방어하는 방법을 실제 코드와 함께 설명합니다.',
    href: '/blog/reentrancy-attack',
    date: '2026.04.07',
  },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Blog() {
  return (
    <section id="blog" className="cc-section bg-cc-primary">
      <div className="cc-container">
        <div className="text-center mb-16">
          <p className="cc-label mb-3">INSIGHTS</p>
          <h2 className="text-4xl font-bold text-cc-text">
            최신 <span className="text-cc-accent">콘텐츠</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {posts.map((p) => (
            <a
              key={p.id}
              href={p.href}
              className="cc-glass hover:border-cc-accent/40 transition-all duration-300 group block overflow-hidden"
            >
              <div className="h-44 bg-cc-accent/5 flex items-center justify-center">
                <span className="text-4xl opacity-20">📄</span>
              </div>
              <div className="p-6">
                <span className="text-xs text-cc-muted">{formatDate(p.date)}</span>
                <h4 className="text-base font-bold text-cc-text mt-2 mb-2 group-hover:text-cc-accent transition-colors leading-snug line-clamp-2">
                  {p.title}
                </h4>
                <p className="text-cc-muted text-sm leading-relaxed line-clamp-3">
                  {p.excerpt}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center">
          <a href="/blog" className="cc-btn cc-btn-ghost">
            전체 글 보기
          </a>
        </div>
      </div>
    </section>
  )
}
