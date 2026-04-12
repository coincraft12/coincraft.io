const tracks = [
  {
    num: '01',
    icon: '📚',
    title: '출판',
    desc: '온체인 시그널 분석 리포트 판매 및 사토시 픽션 집필. 지식을 콘텐츠로 상품화한다.',
    tag: 'ACTIVE',
    tagColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    num: '02',
    icon: '🎓',
    title: '아카데미',
    desc: 'Basic · Associate · Expert 단계별 Web3 구조설계 자격 과정. 검정 시스템 운영.',
    tag: 'ACTIVE',
    tagColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    num: '03',
    icon: '🏦',
    title: 'Custody 설계',
    desc: '기업용 수탁형 지갑 시스템 아키텍처 설계. Java/Spring Boot 기반 운영급 구현.',
    tag: 'IN DEV',
    tagColor: 'bg-blue-500/20 text-blue-400',
  },
  {
    num: '04',
    icon: '🧬',
    title: '핵심 정체성',
    desc: '생활 속에서 자연스럽게 도출되는 철학과 관점. 억지 없는 진정성 브랜딩.',
    tag: 'ONGOING',
    tagColor: 'bg-purple-500/20 text-purple-400',
  },
  {
    num: '05',
    icon: '⚖️',
    title: '특허',
    desc: '블록체인 통합 전략 특허 출원 및 등록. A/B-1 완료, B-2/C 진행 중.',
    tag: 'IN PROGRESS',
    tagColor: 'bg-amber-500/20 text-amber-400',
  },
]

export default function Tracks() {
  return (
    <section id="tracks" className="cc-section bg-cc-primary">
      <div className="cc-container">
        <div className="text-center mb-16">
          <p className="cc-label mb-3">BUSINESS TRACKS</p>
          <h2 className="text-4xl font-bold text-cc-text mb-3">5대 사업 트랙</h2>
          <p className="text-cc-muted">CoinCraft가 동시에 전진하는 다섯 개의 축</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tracks.map((t) => (
            <div key={t.num} className="cc-glass p-6 hover:border-cc-accent/40 transition-colors duration-300">
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl font-black text-cc-accent/20">{t.num}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.tagColor}`}>{t.tag}</span>
              </div>
              <div className="text-2xl mb-3">{t.icon}</div>
              <h3 className="text-lg font-bold text-cc-text mb-2">{t.title}</h3>
              <p className="text-cc-muted text-sm leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
