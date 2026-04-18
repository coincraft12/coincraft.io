const tracks = [
  {
    num: '01',
    icon: '📚',
    title: '출판',
    desc: '리서치와 전문 지식을 콘텐츠로 상품화한다. 온체인 분석 리포트, 기술 보고서, 단행본 출판을 포함한다.',
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
    icon: '🔬',
    title: '리서치',
    desc: '온체인 데이터 분석과 AI×Web3 연구. 현장에서 검증된 인사이트를 지식으로 생산한다.',
    tag: 'ONGOING',
    tagColor: 'bg-purple-500/20 text-purple-400',
  },
  {
    num: '04',
    icon: '🏅',
    title: 'WEB3 인증',
    desc: 'Basic · Associate · Expert 단계별 Web3 구조설계 공식 자격 검정 시스템 운영.',
    tag: 'ACTIVE',
    tagColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    num: '05',
    icon: '⚙️',
    title: '설계',
    desc: 'AI 에이전트가 실제 경제에서 작동할 때 필요한 신원·보안·실행·책임 구조를 설계한다.',
    tag: 'IN DEV',
    tagColor: 'bg-blue-500/20 text-blue-400',
  },
]

export default function Tracks() {
  return (
    <section id="tracks" className="cc-section bg-cc-primary">
      <div className="cc-container">
        <div className="text-center mb-16">
          <p className="cc-label mb-3">BUSINESS TRACKS</p>
          <h2 className="text-4xl font-bold text-cc-text mb-3">5대 사업 트랙</h2>
          <p className="text-cc-muted">COINCRAFT가 동시에 전진하는 다섯 개의 전략 트랙</p>
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
