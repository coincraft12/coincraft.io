'use client';

import { motion } from 'framer-motion';

const channels = [
  { name: 'LinkedIn', handle: 'coincraft-inc', desc: '전문 인사이트 · 업계 분석 · Web3 트렌드', href: 'https://www.linkedin.com/company/coincraft-inc', cta: '팔로우하기', tag: 'PROFESSIONAL', tagCls: 'text-blue-400 bg-blue-500/10 border-blue-500/25', gradFrom: 'from-blue-600/12', borderHover: 'hover:border-blue-500/40',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { name: 'Instagram', handle: '@coincraft.labs', desc: '비하인드 · 감성 콘텐츠 · 커뮤니티 스토리', href: 'https://www.instagram.com/coincraft.labs/', cta: '팔로우하기', tag: 'LIFESTYLE', tagCls: 'text-pink-400 bg-pink-500/10 border-pink-500/25', gradFrom: 'from-pink-600/12', borderHover: 'hover:border-pink-500/40',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg> },
  { name: 'YouTube', handle: '코인크래프트', desc: '강의 영상 · 온체인 분석 · 심층 인터뷰', href: 'https://www.youtube.com/channel/UCT7SwOLZfnx-1zxAprRTQNg', cta: '구독하기', tag: 'VIDEO', tagCls: 'text-red-400 bg-red-500/10 border-red-500/25', gradFrom: 'from-red-600/12', borderHover: 'hover:border-red-500/40',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
];

export default function Community() {
  return (
    <section id="community" className="relative py-24 md:py-36 overflow-hidden bg-cc-primary">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cc-accent/20 to-transparent pointer-events-none" />
      <div className="absolute -left-40 top-1/3 w-[500px] h-[500px] bg-cc-accent/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -right-40 bottom-1/4 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[16vw] font-black text-white/[0.018] tracking-tighter select-none whitespace-nowrap">COMMUNITY</span>
      </div>

      <div className="cc-container relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <p className="cc-label mb-4">COMMUNITY</p>
          <h2 className="text-4xl md:text-5xl font-black text-cc-text mb-4 leading-tight">
            함께 <span className="text-cc-accent glow-text">성장하세요</span>
          </h2>
          <p className="text-cc-muted text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            COINCRAFT의 다양한 채널에서 최신 인사이트와<br className="hidden md:block" />커뮤니티를 경험하세요.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {channels.map((c) => (
            <motion.a
              key={c.name}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative cc-glass p-7 overflow-hidden flex flex-col gap-5 ${c.borderHover} transition-colors duration-300`}
              whileHover={{ y: -6 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.gradFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-cc-accent/40 transition-all duration-500" />
              <div className="relative z-10 flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cc-muted group-hover:text-cc-text group-hover:border-white/20 transition-all duration-300">{c.icon}</div>
                <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-full border ${c.tagCls}`}>{c.tag}</span>
              </div>
              <div className="relative z-10 flex-1">
                <p className="text-xs text-cc-muted/50 mb-0.5">{c.handle}</p>
                <h4 className="text-lg font-black text-cc-text mb-2">{c.name}</h4>
                <p className="text-cc-muted text-sm leading-relaxed">{c.desc}</p>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-sm font-semibold text-cc-accent group-hover:text-cc-text transition-colors duration-300">{c.cta}</span>
                <motion.span className="text-cc-accent text-lg" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>→</motion.span>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-10 md:p-14 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-cc-accent/6 rounded-full blur-[80px]" />
          </div>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cc-accent/30 to-transparent" />
          <div className="relative z-10">
            <p className="cc-label mb-4">지금 시작하세요</p>
            <h3 className="text-3xl md:text-4xl font-black text-cc-text mb-4 leading-tight">
              Web3의 미래를<br /><span className="text-cc-accent glow-text">함께 설계합니다</span>
            </h3>
            <p className="text-cc-muted mb-8 max-w-md mx-auto">강의부터 검정까지 — 지금 바로 COINCRAFT와 함께하세요.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <a href="/courses" className="cc-btn cc-btn-primary btn-shimmer">강의 보기</a>
              <a href="/about" className="cc-btn cc-btn-ghost">더 알아보기</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
