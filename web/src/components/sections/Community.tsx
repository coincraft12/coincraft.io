const channels = [
  {
    icon: 'in',
    name: 'LinkedIn',
    desc: '전문 인사이트 · 업계 분석',
    href: 'https://www.linkedin.com/company/coincraft-inc',
    color: 'hover:border-blue-500/40 hover:bg-blue-500/5',
  },
  {
    icon: '📷',
    name: 'Instagram',
    desc: '감성 콘텐츠 · 일상 스토리',
    href: 'https://www.instagram.com/coincraft.labs/',
    color: 'hover:border-pink-500/40 hover:bg-pink-500/5',
  },
  {
    icon: '▶',
    name: 'YouTube',
    desc: '강의 영상 · 심층 분석',
    href: 'https://www.youtube.com/@코인크래프트',
    color: 'hover:border-red-500/40 hover:bg-red-500/5',
  },
]

export default function Community() {
  return (
    <section id="community" className="cc-section bg-cc-primary">
      <div className="cc-container">
        <div className="text-center mb-16">
          <p className="cc-label mb-3">COMMUNITY</p>
          <h2 className="text-4xl font-bold text-cc-text mb-3">
            함께 <span className="text-cc-accent">성장하세요</span>
          </h2>
          <p className="text-cc-muted">COINCRAFT의 다양한 채널에서 최신 인사이트를 만나보세요.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {channels.map((c) => (
            <a
              key={c.name}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`cc-glass p-8 text-center transition-all duration-300 block ${c.color}`}
            >
              <div className="text-3xl font-bold text-cc-accent mb-4">{c.icon}</div>
              <h4 className="text-lg font-bold text-cc-text mb-2">{c.name}</h4>
              <p className="text-cc-muted text-sm">{c.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
