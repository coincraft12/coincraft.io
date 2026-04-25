'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { num: 7, suffix: '+', label: '강의 커리큘럼' },
  { num: 3, suffix: '+', label: '출원 특허' },
  { num: 2026, suffix: '', label: '운영 시작' },
];

const cards = [
  { icon: '🎯', title: '미션', desc: 'AI와 Web3가 교차하는 지점에서, 실제로 작동하는 신뢰 시스템을 설계한다.', delay: 0.1 },
  { icon: '🔭', title: '비전', desc: 'Web3 구조설계와 AI 신뢰 인프라의 표준을 만드는 전문 기관.', delay: 0.25 },
];

function CountUp({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let current = 0;
    const steps = 50;
    const increment = target / steps;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(interval); }
      else setCount(Math.floor(current));
    }, 25);
    return () => clearInterval(interval);
  }, [active, target]);
  return <>{count}{suffix}</>;
}

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} id="about" className="cc-section bg-cc-secondary/30 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-cc-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="cc-container relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <motion.p className="cc-label mb-3" initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }}>
              ABOUT COINCRAFT
            </motion.p>
            <motion.h2 className="text-4xl font-bold mb-6 text-cc-text" initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
              우리는 <span className="text-cc-accent">무엇을</span> 만드는가
            </motion.h2>
            <motion.p className="text-cc-text text-lg leading-relaxed mb-4" initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
              COINCRAFT는 블록체인을 단순히 가르치는 것을 넘어, AI 에이전트가 실제 경제에서 작동할 때 필요한 신뢰 구조를 설계하는 Web3 전문 조직입니다.
            </motion.p>
            <motion.p className="text-cc-muted leading-relaxed mb-10" initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 }}>
              출판·아카데미·리서치·WEB3 인증·설계, 다섯 개의 트랙을 동시에 전진하며 블록체인 산업의 지식 기반을 만들어갑니다.
            </motion.p>
            <motion.div className="grid grid-cols-3 gap-4" initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.4 }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl md:text-4xl font-black text-cc-accent tabular-nums">
                    <CountUp target={s.num} suffix={s.suffix} active={isInView} />
                  </div>
                  <div className="text-xs md:text-sm text-cc-muted mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="flex flex-col gap-4">
            {cards.map((c) => (
              <motion.div
                key={c.title}
                className="cc-glass p-6 group hover:border-cc-accent/30 transition-all duration-300"
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: c.delay }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="text-2xl mb-3 group-hover:scale-110 inline-block transition-transform duration-300">{c.icon}</div>
                <h3 className="text-lg font-bold text-cc-text mb-2">{c.title}</h3>
                <p className="text-cc-muted leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
