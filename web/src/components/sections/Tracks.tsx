'use client';

import { motion } from 'framer-motion';

const tracks = [
  { num: '01', icon: '📚', title: '출판', desc: '리서치와 전문 지식을 콘텐츠로 상품화한다. 온체인 분석 리포트, 기술 보고서, 단행본 출판.', tag: 'ACTIVE', tagColor: 'text-emerald-400', dotColor: 'bg-emerald-400', gradFrom: 'from-emerald-500/12', borderHover: 'hover:border-emerald-500/30', span: 'md:col-span-3' },
  { num: '02', icon: '🎓', title: '아카데미', desc: '블록체인 기초부터 온체인 분석, Web3 설계까지 — 실무에서 바로 쓰는 지식을 단계별로 배운다.', tag: 'ACTIVE', tagColor: 'text-emerald-400', dotColor: 'bg-emerald-400', gradFrom: 'from-cc-accent/10', borderHover: 'hover:border-cc-accent/30', span: 'md:col-span-3' },
  { num: '03', icon: '🔬', title: '리서치', desc: '온체인 데이터 분석과 AI×Web3 연구. 현장에서 검증된 인사이트를 지식으로 생산한다.', tag: 'ONGOING', tagColor: 'text-purple-400', dotColor: 'bg-purple-400', gradFrom: 'from-purple-600/10', borderHover: 'hover:border-purple-500/30', span: 'md:col-span-2' },
  { num: '04', icon: '🏅', title: 'WEB3 인증', desc: 'Basic · Associate · Expert 공식 자격 검정 시스템.', tag: 'ACTIVE', tagColor: 'text-emerald-400', dotColor: 'bg-emerald-400', gradFrom: 'from-cc-accent/10', borderHover: 'hover:border-cc-accent/30', span: 'md:col-span-2' },
  { num: '05', icon: '⚙️', title: '설계', desc: 'AI 에이전트가 실제 경제에서 작동할 때 필요한 신원·보안·실행·책임 구조를 설계한다.', tag: 'IN DEV', tagColor: 'text-blue-400', dotColor: 'bg-blue-400', gradFrom: 'from-blue-600/10', borderHover: 'hover:border-blue-500/30', span: 'md:col-span-2' },
];

export default function Tracks() {
  return (
    <section id="tracks" className="relative py-24 md:py-36 overflow-hidden bg-[#0d0d14]">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(ellipse at 20% 60%, rgba(245,166,35,0.05) 0%, transparent 55%), radial-gradient(ellipse at 80% 40%, rgba(139,92,246,0.05) 0%, transparent 55%)',
      }} />

      <div className="cc-container relative z-10">
        <div className="mb-16 md:mb-20">
          <p className="cc-label mb-3">BUSINESS TRACKS</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <h2 className="text-4xl md:text-5xl font-black text-cc-text">5대 사업 트랙</h2>
            <p className="text-cc-muted text-sm md:text-base">COINCRAFT가 동시에 전진하는 다섯 개의 전략 트랙</p>
          </div>
          <div className="mt-6 h-px bg-gradient-to-r from-cc-accent/60 via-cc-accent/15 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {tracks.map((t) => (
            <motion.div
              key={t.num}
              className={`group relative cc-glass p-7 overflow-hidden cursor-default ${t.borderHover} ${t.span} transition-colors duration-300`}
              whileHover={{ y: -6 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${t.gradFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute -right-3 -bottom-5 text-[9rem] font-black leading-none text-white/[0.03] group-hover:text-white/[0.06] transition-colors duration-500 select-none pointer-events-none">{t.num}</div>
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent group-hover:via-cc-accent/50 transition-all duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300 inline-block">{t.icon}</span>
                  <div className={`flex items-center gap-1.5 text-xs font-bold tracking-wide ${t.tagColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${t.dotColor} animate-pulse`} />
                    {t.tag}
                  </div>
                </div>
                <p className="text-[11px] font-black text-cc-muted/40 tracking-[0.2em] mb-1">{t.num}</p>
                <h3 className="text-xl font-black text-cc-text mb-3">{t.title}</h3>
                <p className="text-cc-muted text-sm leading-relaxed">{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
