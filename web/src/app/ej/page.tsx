'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import ProfilePhoto from './ProfilePhoto';

// ─────────────────────────────────────────────────────────────────────────────
const LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/coincraft-inc', desc: 'CoinCraft on LinkedIn', icon: 'in', color: 'hover:border-blue-500/50 hover:shadow-blue-500/10' },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCT7SwOLZfnx-1zxAprRTQNg', desc: 'Web3 & onchain content', icon: '▶', color: 'hover:border-red-500/50 hover:shadow-red-500/10' },
  { label: 'Instagram', href: 'https://www.instagram.com/coincraft.labs/', desc: '@coincraft.labs', icon: '◎', color: 'hover:border-pink-500/50 hover:shadow-pink-500/10' },
  { label: 'CoinCraft', href: 'https://coincraft.io', desc: 'Official website', icon: '⬡', color: 'hover:border-cc-accent/50 hover:shadow-cc-accent/10' },
  { label: 'Courses', href: 'https://coincraft.io/courses', desc: 'Structured Web3 learning', icon: '🎓', color: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10' },
  { label: 'Contact', href: 'mailto:ej@coincraft.io', desc: 'ej@coincraft.io', icon: '✉', color: 'hover:border-purple-500/50 hover:shadow-purple-500/10' },
];

const FOCUS = [
  { title: 'Research', icon: '🔬', desc: 'Onchain analysis, market structure, and Web3 ecosystem research' },
  { title: 'Education', icon: '🎓', desc: 'Courses, structured learning, and practical Web3 knowledge' },
  { title: 'Publishing', icon: '📚', desc: 'Books, articles, and long-term intellectual assets' },
];

// ─────────────────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function EJPage() {
  return (
    <main className="min-h-screen bg-cc-primary overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on md+)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col items-center px-5 py-14 min-h-screen">
        <div className="w-full max-w-sm flex flex-col gap-8">

          {/* Profile */}
          <motion.section
            className="flex flex-col items-center text-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Glow ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cc-accent/20 blur-xl animate-pulse scale-110" />
              <ProfilePhoto />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cc-text tracking-tight">EJ Kim</h1>
              <p className="text-cc-muted text-xs mt-0.5">김응준</p>
            </div>
            <div>
              <p className="text-cc-accent font-semibold text-sm tracking-wide">Founder & CEO, CoinCraft</p>
              <p className="text-cc-muted text-xs mt-1">Web3 Research · Education · Publishing</p>
            </div>
          </motion.section>

          {/* Links */}
          <section className="flex flex-col gap-2.5">
            {LINKS.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className={`cc-glass flex items-center justify-between px-5 py-4 rounded-xl shadow-lg transition-all ${link.color}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                whileTap={{ scale: 0.97 }}
              >
                <div>
                  <p className="text-cc-text font-semibold text-sm">{link.label}</p>
                  <p className="text-cc-muted text-xs mt-0.5">{link.desc}</p>
                </div>
                <span className="text-cc-accent text-base font-bold">{link.icon}</span>
              </motion.a>
            ))}
          </section>

          {/* About */}
          <FadeUp>
            <div className="cc-glass p-5 rounded-xl">
              <p className="cc-label mb-3">About</p>
              <p className="text-cc-muted text-sm leading-relaxed">
                EJ Kim은 CoinCraft의 창업자입니다. Web3 리서치, 교육, 출판을 중심으로
                어렵고 낯선 Web3를 더 쉽게 이해할 수 있도록 구조화된 콘텐츠와
                학습 경험을 만드는 데 집중하고 있습니다.
              </p>
            </div>
          </FadeUp>

          {/* Focus */}
          <FadeUp delay={0.1}>
            <div>
              <p className="cc-label mb-3">Focus Areas</p>
              <div className="flex flex-col gap-2">
                {FOCUS.map((f) => (
                  <div key={f.title} className="cc-glass px-4 py-3.5 rounded-xl flex gap-3 items-start">
                    <span className="text-lg flex-shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-cc-text font-semibold text-sm">{f.title}</p>
                      <p className="text-cc-muted text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          <footer className="text-center pb-4">
            <p className="text-cc-muted text-xs">
              <a href="https://coincraft.io" className="hover:text-cc-accent transition-colors">coincraft.io</a>
            </p>
          </footer>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden below md)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen">

        {/* LEFT — sticky sidebar */}
        <aside className="w-72 lg:w-80 flex-shrink-0 sticky top-0 h-screen flex flex-col justify-between p-8 lg:p-10 border-r border-white/8 overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-cc-accent/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-10 w-48 h-48 bg-purple-500/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-8">
            {/* Photo */}
            <motion.div
              className="flex flex-col items-center text-center gap-5 pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative">
                {/* Spinning gradient ring */}
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cc-accent via-purple-500 to-cc-accent opacity-60 blur-sm animate-spin-slow" />
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-cc-accent/30">
                  <Image src="/ej-profile.jpg" alt="EJ Kim" fill className="object-cover object-top" quality={100} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-cc-text">EJ Kim</h1>
                <p className="text-cc-muted text-xs mt-0.5">김응준</p>
                <p className="text-cc-accent font-semibold text-xs mt-2 tracking-wide">Founder & CEO</p>
                <p className="text-cc-muted text-xs">CoinCraft</p>
              </div>
            </motion.div>

            {/* Short bio */}
            <motion.p
              className="text-cc-muted text-xs leading-relaxed text-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            >
              Web3 Research · Education · Publishing<br />
              Building trust infrastructure for the AI era.
            </motion.p>

            {/* Focus pills */}
            <motion.div
              className="flex flex-wrap justify-center gap-1.5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
            >
              {FOCUS.map((f) => (
                <span key={f.title} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-cc-muted">
                  {f.icon} {f.title}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Bottom footer */}
          <motion.p
            className="relative z-10 text-center text-xs text-cc-muted/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            <a href="https://coincraft.io" className="hover:text-cc-accent transition-colors">coincraft.io</a>
          </motion.p>
        </aside>

        {/* RIGHT — scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Hero text */}
          <section className="relative px-10 lg:px-16 py-20 lg:py-28 overflow-hidden border-b border-white/8">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="aurora-blob aurora-1" style={{ opacity: 0.15 }} />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-cc-primary" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <motion.p className="cc-label mb-4" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                ABOUT
              </motion.p>
              <motion.h2 className="text-4xl lg:text-5xl font-black text-cc-text leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                Building the trust<br />
                <span className="text-cc-accent glow-text">layer of Web3.</span>
              </motion.h2>
              <motion.p className="text-cc-muted leading-relaxed text-base lg:text-lg"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                EJ Kim은 CoinCraft의 창업자입니다. Web3 리서치, 교육, 출판을 중심으로
                AI 에이전트가 실제 경제에서 작동할 때 필요한 신뢰 구조를 설계하고,
                어렵고 낯선 Web3를 더 쉽게 이해할 수 있도록 구조화된 콘텐츠와
                학습 경험을 만드는 데 집중하고 있습니다.
              </motion.p>
            </div>
          </section>

          {/* Focus areas */}
          <section className="px-10 lg:px-16 py-12 border-b border-white/8">
            <FadeUp>
              <p className="cc-label mb-6">Focus Areas</p>
            </FadeUp>
            <div className="grid grid-cols-3 gap-4">
              {FOCUS.map((f, i) => (
                <FadeUp key={f.title} delay={i * 0.1}>
                  <motion.div
                    className="cc-glass p-5 rounded-xl group cursor-default overflow-hidden relative"
                    whileHover={{ scale: 1.03, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cc-accent/0 to-transparent group-hover:via-cc-accent/50 transition-all duration-500" />
                    <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
                    <h3 className="font-bold text-cc-text text-sm mb-1.5">{f.title}</h3>
                    <p className="text-cc-muted text-xs leading-relaxed">{f.desc}</p>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </section>

          {/* Links grid */}
          <section className="px-10 lg:px-16 py-12">
            <FadeUp>
              <p className="cc-label mb-6">Links</p>
            </FadeUp>
            <div className="grid grid-cols-2 gap-3">
              {LINKS.map((link, i) => (
                <FadeUp key={link.label} delay={i * 0.07}>
                  <motion.a
                    href={link.href}
                    target={link.href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className={`cc-glass flex items-center gap-4 px-5 py-4 rounded-xl shadow-md transition-all ${link.color}`}
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <span className="text-cc-accent text-xl w-7 text-center flex-shrink-0">{link.icon}</span>
                    <div className="min-w-0">
                      <p className="text-cc-text font-semibold text-sm">{link.label}</p>
                      <p className="text-cc-muted text-xs mt-0.5 truncate">{link.desc}</p>
                    </div>
                  </motion.a>
                </FadeUp>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
