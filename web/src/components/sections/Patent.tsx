'use client';

import { motion } from 'framer-motion';

const patents = [
  { num: '01', label: '복구 정보 비가역적 소멸 보안 매체', done: true, slug: 'secure-media', year: '2024' },
  { num: '02', label: '단방향 상태머신 기반 복구 시스템', done: true, slug: 'state-machine-recovery', year: '2024' },
  { num: '03', label: '다중키 오프라인 복구 시스템', done: true, slug: 'multi-key-recovery', year: '2025' },
  { num: '04', label: '온체인 TX 기반 역량 인증', done: false, slug: null, year: '출원 중' },
  { num: '05', label: '멀티테넌트·멀티체인 서명자 동적 라우팅', done: false, slug: null, year: '가출원 완료' },
  { num: '06', label: '이중레이어 출금·TX 논스 canonical 처리', done: false, slug: null, year: '가출원 완료' },
];

function HexShield() {
  const hexPoints = '140,22 238,78 238,190 140,246 42,190 42,78';
  const midHexPoints = '140,52 208,90 208,178 140,218 72,178 72,90';
  const innerHexPoints = '140,82 178,104 178,164 140,188 102,164 102,104';
  const corners: [number, number][] = [[140,22],[238,78],[238,190],[140,246],[42,190],[42,78]];
  const spokes: [number,number,number,number][] = [[140,22,140,52],[238,78,208,90],[238,190,208,178],[140,246,140,218],[42,190,72,178],[42,78,72,90]];

  return (
    <div className="relative flex items-center justify-center select-none">
      <div className="absolute w-72 h-72 bg-cc-accent/10 rounded-full blur-[70px]" />
      <svg width="280" height="268" viewBox="0 0 280 268" className="relative z-10 overflow-visible">
        <motion.circle cx="140" cy="134" r="115" fill="none" stroke="rgba(245,166,35,0.08)" strokeWidth="1" strokeDasharray="6 14"
          animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '140px 134px' }} />
        <polygon points={hexPoints} fill="none" stroke="rgba(245,166,35,0.15)" strokeWidth="1" />
        <polygon points={midHexPoints} fill="none" stroke="rgba(245,166,35,0.3)" strokeWidth="1.5" />
        <polygon points={innerHexPoints} fill="rgba(245,166,35,0.05)" stroke="rgba(245,166,35,0.55)" strokeWidth="2" />
        {spokes.map(([x1,y1,x2,y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(245,166,35,0.45)" strokeWidth="1.5" />
        ))}
        {corners.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="rgba(245,166,35,0.9)" />
        ))}
        <text x="140" y="148" textAnchor="middle" fontSize="44">🛡️</text>
      </svg>
      <div className="absolute top-4 right-0 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-cc-accent shadow-lg shadow-cc-accent/30">
        <span className="text-cc-primary font-black text-xl leading-none">3</span>
        <span className="text-cc-primary text-[10px] font-bold leading-tight">출원완료</span>
      </div>
      <div className="absolute bottom-6 left-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-cc-accent/25">
        <span className="w-1.5 h-1.5 rounded-full bg-cc-accent animate-pulse" />
        <span className="text-cc-accent text-[11px] font-bold">2건 가출원 완료</span>
      </div>
    </div>
  );
}

export default function Patent() {

  return (
    <section id="patent" className="relative py-24 md:py-36 overflow-hidden bg-[#0d0d14]">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='64' viewBox='0 0 56 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 4 L52 18 L52 46 L28 60 L4 46 L4 18 Z' fill='none' stroke='rgba(245,166,35,0.05)' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '56px 64px',
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d14] via-transparent to-[#0d0d14] pointer-events-none" />
      <div className="absolute right-0 top-1/3 w-[500px] h-[500px] bg-cc-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="cc-container relative z-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="cc-label mb-3">PATENT &amp; RESEARCH</p>
            <h2 className="text-4xl md:text-5xl font-black text-cc-text mb-5 leading-tight">
              블록체인 특허로<br />
              <span className="text-cc-accent glow-text">기술을 보호합니다</span>
            </h2>
            <p className="text-cc-muted leading-relaxed mb-8 text-sm md:text-base">
              COINCRAFT는 설계한 기술을 특허로 보호합니다.
              보안 매체·복구 시스템·다중키 복구 3건 출원 완료,
              서명자 라우팅·TX 논스 처리 2건 가출원 완료,
              온체인 역량 인증 특허 출원 진행 중입니다.
            </p>
            <div className="space-y-2.5">
              {patents.map((p) => (
                <div key={p.label}>
                  {p.slug ? (
                    <a href={`/patents/${p.slug}`} className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-cc-accent/35 hover:bg-cc-accent/5 transition-all duration-300">
                      <span className="text-xs font-black text-cc-accent/40 group-hover:text-cc-accent transition-colors w-5 shrink-0 tabular-nums">{p.num}</span>
                      <span className="text-sm text-cc-muted group-hover:text-cc-text transition-colors flex-1 leading-snug">{p.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-cc-muted/40">{p.year}</span>
                        <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-400 text-[10px] font-bold">✓</span>
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs font-black text-white/15 w-5 shrink-0 tabular-nums">{p.num}</span>
                      <span className="text-sm text-cc-muted/50 flex-1 leading-snug">{p.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-cc-accent/70 font-semibold">{p.year}</span>
                        <div className="w-5 h-5 rounded-full border border-cc-accent/30 flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-cc-accent animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center py-8 md:py-0">
            <HexShield />
          </div>
        </div>
      </div>
    </section>
  );
}
