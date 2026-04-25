'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

const tracks = [
  { num: '01', icon: '📚', title: '출판', color: 'from-amber-500/15 to-transparent', border: 'border-amber-500/20', tag: 'ACTIVE', tagCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', desc: '리서치와 전문 지식을 콘텐츠로 상품화한다. 온체인 분석 리포트, 기술 보고서, 단행본 출판을 포함한다.' },
  { num: '02', icon: '🎓', title: '아카데미', color: 'from-blue-500/15 to-transparent', border: 'border-blue-500/20', tag: 'ACTIVE', tagCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', desc: 'Basic · Associate · Expert 단계별 Web3 구조설계 자격 과정. AI 기반 Q&A 시스템 운영.' },
  { num: '03', icon: '🔬', title: '리서치', color: 'from-purple-500/15 to-transparent', border: 'border-purple-500/20', tag: 'ONGOING', tagCls: 'bg-purple-500/15 text-purple-400 border-purple-500/25', desc: '온체인 데이터 분석과 AI×Web3 연구. 현장에서 검증된 인사이트를 지식으로 생산한다.' },
  { num: '04', icon: '🏅', title: 'WEB3 인증', color: 'from-yellow-500/15 to-transparent', border: 'border-yellow-500/20', tag: 'ACTIVE', tagCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', desc: 'Basic · Associate · Expert 단계별 Web3 구조설계 공식 자격 검정 시스템 운영.' },
  { num: '05', icon: '⚙️', title: '설계', color: 'from-cyan-500/15 to-transparent', border: 'border-cyan-500/20', tag: 'IN DEV', tagCls: 'bg-blue-500/15 text-blue-400 border-blue-500/25', desc: 'AI 에이전트가 실제 경제에서 작동할 때 필요한 신원·보안·실행·책임 구조를 설계한다.' },
];

const certs = [
  { level: 'Basic', icon: '🟢', gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10', color: 'text-emerald-400', desc: '블록체인 기초 이해 및 Web3 생태계 파악. 입문자를 위한 실무 기반 커리큘럼.' },
  { level: 'Associate', icon: '🔵', gradient: 'from-blue-500/20 via-blue-500/5 to-transparent', border: 'border-blue-500/30', glow: 'shadow-blue-500/10', color: 'text-blue-400', desc: '스마트컨트랙트 설계 및 DeFi 아키텍처 구현. 심화 기술 역량을 검증한다.' },
  { level: 'Expert', icon: '🟣', gradient: 'from-purple-500/20 via-purple-500/5 to-transparent', border: 'border-purple-500/30', glow: 'shadow-purple-500/10', color: 'text-purple-400', desc: '엔터프라이즈 블록체인 시스템 총괄 설계. 업계 최고 수준의 구조설계 전문가 인증.' },
];

const values = [
  { icon: '🎯', label: '미션', title: '신뢰를 설계한다', body: 'AI와 Web3가 교차하는 지점에서, 실제로 작동하는 신뢰 시스템을 설계한다.' },
  { icon: '🔭', label: '비전', title: '표준이 된다', body: 'Web3 구조설계와 AI 신뢰 인프라의 표준을 만드는 전문 기관으로 자리잡는다.' },
  { icon: '⚡', label: '원칙', title: '검증된 것만', body: '현장에서 검증되지 않은 것은 가르치지 않는다. 실무에서 실제로 작동하는 지식만 다룬다.' },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary overflow-x-hidden">

        {/* HERO */}
        <section ref={heroRef} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="aurora-blob aurora-1" style={{ opacity: 0.3 }} />
            <div className="aurora-blob aurora-2" style={{ opacity: 0.2 }} />
            <div className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(rgba(245,166,35,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.05) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cc-primary" />
          </div>

          <motion.div className="cc-container relative z-10 text-center pt-32 pb-20" style={{ y: heroY, opacity: heroOpacity }}>
            <motion.p className="cc-label mb-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              ABOUT COINCRAFT
            </motion.p>
            <motion.h1 className="hero-title font-black text-cc-text mb-6 leading-tight"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }}>
              우리는 <span className="text-cc-accent glow-text">무엇을</span><br />만드는가
            </motion.h1>
            <motion.p className="text-base md:text-xl text-cc-muted max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.25 }}>
              COINCRAFT는 블록체인을 단순히 가르치는 것을 넘어,<br className="hidden sm:block" />
              AI 에이전트가 실제 경제에서 작동할 때 필요한<br className="hidden sm:block" />
              신뢰 구조를 설계하는 Web3 전문 조직입니다.
            </motion.p>
          </motion.div>
        </section>

        {/* VALUES — bento */}
        <section className="cc-section">
          <div className="cc-container">
            <FadeUp className="text-center mb-10 md:mb-14">
              <p className="cc-label mb-3">CORE VALUES</p>
              <h2 className="cc-heading font-bold text-cc-text">존재의 이유</h2>
            </FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {values.map((v, i) => (
                <FadeUp key={v.label} delay={i * 0.1}>
                  <motion.div
                    className="relative cc-glass p-6 md:p-8 h-full overflow-hidden group cursor-default"
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cc-accent/0 to-transparent group-hover:via-cc-accent/60 transition-all duration-500" />
                    <div className="text-3xl mb-4 inline-block group-hover:scale-110 transition-transform duration-300">{v.icon}</div>
                    <p className="cc-label mb-2">{v.label}</p>
                    <h3 className="text-xl font-bold text-cc-text mb-3">{v.title}</h3>
                    <p className="text-cc-muted text-sm leading-relaxed">{v.body}</p>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* TRACKS */}
        <section className="cc-section bg-cc-secondary/20 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[700px] h-[350px] bg-cc-accent/3 rounded-full blur-3xl" />
          </div>
          <div className="cc-container relative z-10">
            <FadeUp className="text-center mb-10 md:mb-14">
              <p className="cc-label mb-3">BUSINESS TRACKS</p>
              <h2 className="cc-heading font-bold text-cc-text mb-3">5대 전략 트랙</h2>
              <p className="text-cc-muted text-sm md:text-base">COINCRAFT가 동시에 전진하는 다섯 개의 축</p>
            </FadeUp>
            <div className="space-y-3">
              {tracks.map((t, i) => (
                <FadeUp key={t.num} delay={i * 0.08}>
                  <motion.div
                    className={`flex items-start md:items-center gap-4 md:gap-6 p-5 md:p-6 rounded-xl border bg-gradient-to-r ${t.color} ${t.border} overflow-hidden group cursor-default`}
                    whileHover={{ x: 6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <span className="text-3xl md:text-5xl font-black text-white/8 group-hover:text-white/15 transition-colors duration-300 flex-shrink-0 leading-none select-none">{t.num}</span>
                    <span className="text-xl md:text-2xl flex-shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm md:text-lg font-bold text-cc-text">{t.title}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${t.tagCls}`}>{t.tag}</span>
                      </div>
                      <p className="text-cc-muted text-xs md:text-sm leading-relaxed">{t.desc}</p>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* CERT LEVELS */}
        <section className="cc-section relative overflow-hidden">
          <div className="cc-container relative z-10">
            <FadeUp className="text-center mb-10 md:mb-14">
              <p className="cc-label mb-3">CERTIFICATION</p>
              <h2 className="cc-heading font-bold text-cc-text mb-3">자격 인증 체계</h2>
              <p className="text-cc-muted text-sm md:text-base">단계별 실력 검증으로 Web3 전문가로 성장하세요</p>
            </FadeUp>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {certs.map((c, i) => (
                <FadeUp key={c.level} delay={i * 0.12}>
                  <motion.div
                    className={`relative rounded-xl border ${c.border} bg-gradient-to-b ${c.gradient} p-6 md:p-8 text-center overflow-hidden group cursor-default shadow-lg ${c.glow}`}
                    whileHover={{ scale: 1.04, y: -6 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                  >
                    <div className="text-4xl mb-4">{c.icon}</div>
                    <p className={`text-lg font-black mb-3 ${c.color}`}>{c.level}</p>
                    <p className="text-cc-muted text-sm leading-relaxed mb-5">{c.desc}</p>
                    <a href="/courses" className={`inline-block text-xs font-bold px-4 py-2 rounded-full border ${c.border} ${c.color} hover:bg-white/5 transition-colors`}>
                      강의 보기 →
                    </a>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* FOUNDER */}
        <section className="cc-section bg-cc-secondary/20">
          <div className="cc-container">
            <FadeUp className="text-center mb-10 md:mb-14">
              <p className="cc-label mb-3">FOUNDER</p>
              <h2 className="cc-heading font-bold text-cc-text">만든 사람</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <motion.a
                href="/ej"
                className="group flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8 max-w-2xl mx-auto cc-glass p-6 md:p-8 rounded-2xl hover:border-cc-accent/30 transition-all duration-300 overflow-hidden relative"
                whileHover={{ scale: 1.015, y: -3 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cc-accent/0 to-transparent group-hover:via-cc-accent/60 transition-all duration-500" />
                {/* Photo */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-cc-accent/20 blur-lg group-hover:bg-cc-accent/30 transition-colors duration-300" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-cc-accent/40 group-hover:border-cc-accent/70 transition-colors duration-300">
                    <img src="/ej-profile.jpg" alt="EJ Kim" className="w-full h-full object-cover object-top" />
                  </div>
                </div>
                {/* Text */}
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs text-cc-muted mb-1">Founder & CEO</p>
                  <h3 className="text-xl font-black text-cc-text mb-0.5">EJ Kim <span className="text-cc-muted font-normal text-sm">김응준</span></h3>
                  <p className="text-cc-accent text-xs font-semibold tracking-wide mb-3">Web3 Research · Education · Publishing</p>
                  <p className="text-cc-muted text-sm leading-relaxed">
                    CoinCraft를 만든 사람. AI 에이전트가 실제 경제에서 작동할 때 필요한 신뢰 구조를 설계합니다.
                  </p>
                  <p className="mt-4 text-xs font-bold text-cc-accent group-hover:gap-2 flex items-center justify-center sm:justify-start gap-1 transition-all">
                    View Profile <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </p>
                </div>
              </motion.a>
            </FadeUp>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-cc-primary via-cc-secondary/30 to-cc-primary" />
            <div className="aurora-blob aurora-3" style={{ opacity: 0.2 }} />
          </div>
          <FadeUp className="cc-container relative z-10 text-center">
            <p className="cc-label mb-4">JOIN US</p>
            <h2 className="cc-heading font-bold text-cc-text mb-5">
              함께 <span className="text-cc-accent">설계하는</span> 사람이 되세요
            </h2>
            <p className="text-cc-muted mb-8 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
              COINCRAFT의 강의로 Web3 구조설계의 기초부터 전문가 수준까지 체계적으로 성장하세요.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <a href="/courses" className="cc-btn cc-btn-primary btn-shimmer text-center">강의 보기</a>
              <a href="/cert/apply" className="cc-btn cc-btn-ghost text-center">검정 신청</a>
            </div>
          </FadeUp>
        </section>

      </main>
      <Footer />
    </>
  );
}
