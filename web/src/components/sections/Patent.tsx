const badges = [
  { label: '복구 정보 비가역적 소멸 보안 매체', done: true, slug: 'secure-media' },
  { label: '단방향 상태머신 기반 복구 시스템', done: true, slug: 'state-machine-recovery' },
  { label: '다중키 오프라인 복구 시스템', done: true, slug: 'multi-key-recovery' },
  { label: '온체인 TX 기반 역량 인증 (출원 중)', done: false, slug: null },
]

export default function Patent() {
  return (
    <section id="patent" className="cc-section bg-cc-secondary/30">
      <div className="cc-container">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="cc-label mb-3">PATENT &amp; RESEARCH</p>
            <h2 className="text-4xl font-bold text-cc-text mb-6">
              블록체인 특허로<br />
              <span className="text-cc-accent">기술을 보호합니다</span>
            </h2>
            <p className="text-cc-muted leading-relaxed mb-8">
              COINCRAFT는 설계한 기술을 특허로 보호합니다.<br />
              보안 매체·복구 시스템·다중키 복구 3건 출원 완료,<br />
              온체인 역량 인증 특허 출원 진행 중입니다.
            </p>
            <div className="flex flex-wrap gap-3">
              {badges.map((b) =>
                b.slug ? (
                  <a
                    key={b.label}
                    href={`/patents/${b.slug}`}
                    className="px-4 py-2 rounded-full text-sm font-semibold border bg-cc-accent/10 border-cc-accent/40 text-cc-accent hover:bg-cc-accent/20 transition-all"
                  >
                    ✓ {b.label}
                  </a>
                ) : (
                  <span
                    key={b.label}
                    className="px-4 py-2 rounded-full text-sm font-semibold border bg-white/5 border-white/10 text-cc-muted"
                  >
                    {b.label}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-48 h-48 rounded-cc-lg cc-glass flex items-center justify-center text-7xl">
              ⚖️
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
