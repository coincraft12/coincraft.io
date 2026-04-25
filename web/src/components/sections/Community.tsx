'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const channels = [
  { icon: 'in', name: 'LinkedIn', desc: '전문 인사이트 · 업계 분석', href: 'https://www.linkedin.com/company/coincraft-inc', color: 'hover:border-blue-500/40 hover:shadow-blue-500/10', glow: 'rgba(59,130,246,0.06)' },
  { icon: '📷', name: 'Instagram', desc: '감성 콘텐츠 · 일상 스토리', href: 'https://www.instagram.com/coincraft.labs/', color: 'hover:border-pink-500/40 hover:shadow-pink-500/10', glow: 'rgba(236,72,153,0.06)' },
  { icon: '▶', name: 'YouTube', desc: '강의 영상 · 심층 분석', href: 'https://www.youtube.com/@코인크래프트', color: 'hover:border-red-500/40 hover:shadow-red-500/10', glow: 'rgba(239,68,68,0.06)' },
];

export default function Community() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="community" className="cc-section bg-cc-primary relative overflow-hidden">
      <div className="cc-container relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="cc-label mb-3">COMMUNITY</p>
          <h2 className="text-4xl font-bold text-cc-text mb-3">
            함께 <span className="text-cc-accent">성장하세요</span>
          </h2>
          <p className="text-cc-muted">COINCRAFT의 다양한 채널에서 최신 인사이트를 만나보세요.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {channels.map((c, i) => (
            <motion.a
              key={c.name}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`cc-glass p-8 text-center transition-all duration-300 block hover:shadow-lg ${c.color}`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.04, y: -4 }}
            >
              <div className="text-3xl font-bold text-cc-accent mb-4">{c.icon}</div>
              <h4 className="text-lg font-bold text-cc-text mb-2">{c.name}</h4>
              <p className="text-cc-muted text-sm">{c.desc}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
