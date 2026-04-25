'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ParticleCanvas from '@/components/ui/ParticleCanvas';

const WORDS = ['Web3 신뢰를', '블록체인을', '에이전트를', '미래 구조를'];

export default function Hero() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('_r')) {
      url.searchParams.delete('_r');
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  useEffect(() => {
    const word = WORDS[wordIdx];
    if (!deleting) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setDeleting(true), 2200);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % WORDS.length);
      }
    }
  }, [displayed, deleting, wordIdx]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-cc-primary">
      {/* Aurora blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
      </div>

      {/* Perspective grid — hidden on mobile for perf */}
      <div className="hidden sm:block absolute inset-0 pointer-events-none" style={{ perspective: '800px' }}>
        <div className="absolute inset-0 grid-perspective" />
      </div>

      {/* Particles */}
      <ParticleCanvas />

      {/* Noise overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Content — y parallax only, no opacity transform */}
      <motion.div className="cc-container relative z-10 pt-28 pb-20 md:py-32" style={{ y }}>
        <div className="max-w-4xl mx-auto text-center">

          {/* CSS animations — always replay on mount regardless of router cache */}
          <div className="hero-anim-1">
            <span className="inline-flex items-center gap-2 cc-label mb-4 md:mb-6">
              <span className="w-2 h-2 rounded-full bg-cc-accent animate-pulse flex-shrink-0" />
              Web3 · AI · Blockchain Architecture
            </span>
          </div>

          <h1 className="hero-title font-black leading-tight mb-5 md:mb-6 text-cc-text hero-anim-2">
            AI 시대의{' '}
            <span className="relative">
              <span className="text-cc-accent glow-text">
                {displayed}
                <span className="typing-cursor" />
              </span>
            </span>
            <br />
            <span className="text-gradient">설계하는 사람들</span>
          </h1>

          <p className="text-base md:text-xl text-cc-muted mb-8 md:mb-10 leading-relaxed max-w-2xl mx-auto hero-anim-3">
            COINCRAFT는 Web3 구조설계 교육·인증, 온체인 리서치,
            AI 에이전트 신뢰 설계를 통해 블록체인 산업의 미래를 만들어갑니다.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 hero-anim-4">
            <a href="/courses" className="cc-btn cc-btn-primary btn-shimmer text-center">강의 보기</a>
            <a href="#about" className="cc-btn cc-btn-ghost text-center">더 알아보기</a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-8 md:mt-16 md:pt-10 border-t border-white/10 hero-anim-5">
            {[
              { num: '7+', label: '강의 커리큘럼' },
              { num: '3+', label: '출원 특허' },
              { num: '2건', label: '기업 컨설팅·강연' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-black text-cc-accent">{s.num}</p>
                <p className="text-xs md:text-sm text-cc-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="hidden sm:flex absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2 hero-anim-6">
        <span className="text-xs text-cc-muted tracking-widest uppercase">Scroll</span>
        <div className="scroll-mouse">
          <div className="scroll-dot" />
        </div>
      </div>
    </section>
  );
}
