'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const badges = [
  { label: '복구 정보 비가역적 소멸 보안 매체', done: true, slug: 'secure-media' },
  { label: '단방향 상태머신 기반 복구 시스템', done: true, slug: 'state-machine-recovery' },
  { label: '다중키 오프라인 복구 시스템', done: true, slug: 'multi-key-recovery' },
  { label: '온체인 TX 기반 역량 인증 (출원 중)', done: false, slug: null },
];

export default function Patent() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="patent" className="cc-section bg-cc-secondary/30 relative overflow-hidden">
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-80 h-80 bg-cc-accent/4 rounded-full blur-3xl pointer-events-none" />

      <div className="cc-container relative z-10">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <motion.p className="cc-label mb-3" initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }}>
              PATENT &amp; RESEARCH
            </motion.p>
            <motion.h2 className="text-3xl md:text-4xl font-bold text-cc-text mb-5 md:mb-6" initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
              블록체인 특허로<br />
              <span className="text-cc-accent">기술을 보호합니다</span>
            </motion.h2>
            <motion.p className="text-cc-muted leading-relaxed mb-7 md:mb-8 text-sm md:text-base" initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
              COINCRAFT는 설계한 기술을 특허로 보호합니다.
              보안 매체·복구 시스템·다중키 복구 3건 출원 완료,
              온체인 역량 인증 특허 출원 진행 중입니다.
            </motion.p>
            <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }}>
              {badges.map((b) =>
                b.slug ? (
                  <a key={b.label} href={`/patents/${b.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border bg-cc-accent/10 border-cc-accent/40 text-cc-accent hover:bg-cc-accent/20 transition-all">
                    <span className="text-xs">✓</span>{b.label}
                  </a>
                ) : (
                  <span key={b.label}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border bg-white/5 border-white/10 text-cc-muted">
                    {b.label}
                  </span>
                )
              )}
            </motion.div>
          </div>

          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ rotate: 3, scale: 1.05 }}
          >
            <div className="w-28 h-28 md:w-48 md:h-48 rounded-cc-lg cc-glass flex items-center justify-center text-5xl md:text-7xl hover:border-cc-accent/30 transition-colors duration-300">
              ⚖️
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
