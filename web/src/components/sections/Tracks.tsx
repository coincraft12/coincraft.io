'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const tracks = [
  { num: '01', icon: '📚', title: '출판', desc: '리서치와 전문 지식을 콘텐츠로 상품화한다. 온체인 분석 리포트, 기술 보고서, 단행본 출판을 포함한다.', tag: 'ACTIVE', tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { num: '02', icon: '🎓', title: '아카데미', desc: 'Basic · Associate · Expert 단계별 Web3 구조설계 자격 과정. 검정 시스템 운영.', tag: 'ACTIVE', tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { num: '03', icon: '🔬', title: '리서치', desc: '온체인 데이터 분석과 AI×Web3 연구. 현장에서 검증된 인사이트를 지식으로 생산한다.', tag: 'ONGOING', tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { num: '04', icon: '🏅', title: 'WEB3 인증', desc: 'Basic · Associate · Expert 단계별 Web3 구조설계 공식 자격 검정 시스템 운영.', tag: 'ACTIVE', tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { num: '05', icon: '⚙️', title: '설계', desc: 'AI 에이전트가 실제 경제에서 작동할 때 필요한 신원·보안·실행·책임 구조를 설계한다.', tag: 'IN DEV', tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function Tracks() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="tracks" className="cc-section bg-cc-primary relative overflow-hidden">
      {/* Background glow center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-cc-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="cc-container relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="cc-label mb-3">BUSINESS TRACKS</p>
          <h2 className="text-4xl font-bold text-cc-text mb-3">5대 사업 트랙</h2>
          <p className="text-cc-muted">COINCRAFT가 동시에 전진하는 다섯 개의 전략 트랙</p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
        >
          {tracks.map((t) => (
            <motion.div
              key={t.num}
              variants={cardVariant}
              whileHover={{ scale: 1.03, y: -4 }}
              className="relative cc-glass p-6 group cursor-default overflow-hidden"
            >
              {/* Inner glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.08) 0%, transparent 70%)' }} />

              {/* Top border glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cc-accent/0 to-transparent group-hover:via-cc-accent/50 transition-all duration-500" />

              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl font-black text-cc-accent/15 group-hover:text-cc-accent/30 transition-colors duration-300">{t.num}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${t.tagColor}`}>{t.tag}</span>
              </div>
              <div className="text-2xl mb-3 group-hover:scale-110 inline-block transition-transform duration-300">{t.icon}</div>
              <h3 className="text-lg font-bold text-cc-text mb-2">{t.title}</h3>
              <p className="text-cc-muted text-sm leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
