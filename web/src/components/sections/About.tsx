'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const MANIFESTO = [
  '신뢰가 코드로 구현되는 세상.',
  'AI 에이전트가 투명하게 작동하는 경제.',
  'Web3가 선택이 아닌 인프라가 되는 미래.',
];

const stats = [
  { num: 7, suffix: '+', label: '강의 커리큘럼' },
  { num: 3, suffix: '+', label: '출원 특허' },
  { num: 2, suffix: '건', label: '기업 컨설팅·강연' },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let current = 0;
        const steps = 60;
        const increment = target / steps;
        const id = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(id); }
          else setCount(Math.floor(current));
        }, 18);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref}>{count}{suffix}</div>;
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  return (
    <section ref={sectionRef} id="about" className="relative py-24 md:py-36 overflow-hidden bg-cc-primary">
      <motion.div style={{ y: gridY }} className="absolute inset-[-20%] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(245,166,35,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.04) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
        <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-cc-primary to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-cc-primary to-transparent" />
      </motion.div>
      <div className="absolute -left-32 top-1/4 w-[500px] h-[500px] bg-cc-accent/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -right-32 bottom-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="cc-container relative z-10">
        <p className="cc-label mb-8">ABOUT COINCRAFT</p>

        <div className="grid md:grid-cols-2 gap-10 md:gap-20 mb-16 md:mb-24 items-start">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-cc-text leading-[1.12]">
            우리는 <span className="text-cc-accent glow-text">무엇을</span><br />만드는가
          </h2>
          <div className="border-l-2 border-cc-accent/40 pl-6 md:pl-8">
            {MANIFESTO.map((line, i) => (
              <p key={i} className="text-base md:text-lg text-cc-muted leading-relaxed mb-2">{line}</p>
            ))}
            <p className="text-base md:text-lg font-bold text-cc-text mt-5">우리는 그 구조를 설계한다.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-b border-white/8 divide-x divide-white/8 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="py-8 px-4 md:px-10 text-center">
              <div className="text-4xl md:text-6xl font-black text-cc-accent tabular-nums leading-none mb-2">
                <CountUp target={s.num} suffix={s.suffix} />
              </div>
              <div className="text-xs md:text-sm text-cc-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'MISSION', title: '미션', desc: 'AI와 Web3가 교차하는 지점에서, 실제로 작동하는 신뢰 시스템을 설계한다.', gradFrom: 'from-cc-accent/8', borderHover: 'hover:border-cc-accent/30' },
            { label: 'VISION', title: '비전', desc: 'Web3 구조설계와 AI 신뢰 인프라의 표준을 만드는 전문 기관.', gradFrom: 'from-purple-600/8', borderHover: 'hover:border-purple-500/30' },
          ].map((c) => (
            <motion.div
              key={c.label}
              className={`group relative cc-glass p-8 overflow-hidden cursor-default ${c.borderHover} transition-colors duration-300`}
              whileHover={{ y: -4 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.gradFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cc-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <span className="cc-label mb-4 block">{c.label}</span>
                <h3 className="text-xl font-black text-cc-text mb-3">{c.title}</h3>
                <p className="text-cc-muted leading-relaxed">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
