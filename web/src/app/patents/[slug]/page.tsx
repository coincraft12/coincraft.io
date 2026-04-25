import { notFound } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

interface PatentDetail {
  title: string;
  status: '출원 완료' | '출원 중';
  category: string;
  summary: string;
  problem: string;
  solution: string;
  points: string[];
}

const PATENTS: Record<string, PatentDetail> = {
  'secure-media': {
    title: '복구 정보 비가역적 소멸 보안 매체',
    status: '출원 완료',
    category: '보안 하드웨어',
    summary: '디지털 자산의 복구 정보를 물리적 매체에 저장하되, 특정 조건이 충족될 경우 해당 정보가 비가역적으로 소멸되도록 설계된 보안 매체에 관한 특허입니다.',
    problem: '기존 시드 구문·복구 키 보관 방식은 물리적 매체(종이, 금속판)에 평문으로 노출되어 분실·탈취 시 자산을 완전히 잃게 됩니다. 매체 자체가 탈취되면 복구 정보가 그대로 노출되는 구조적 한계가 있습니다.',
    solution: '복구 정보를 저장한 매체에 비가역적 소멸 메커니즘을 내장하여, 무단 접근·해체 시도·특정 환경 조건에서 복구 정보가 자동으로 파괴됩니다. 정당한 소유자만이 안전한 절차를 통해 정보에 접근할 수 있습니다.',
    points: [
      '물리적 탈취 시 복구 정보 자동 소멸',
      '정당한 소유자의 접근 절차 설계',
      '기존 콜드 스토리지 대비 향상된 물리적 보안',
      '디지털 자산 커스터디 인프라 적용 가능',
    ],
  },
  'state-machine-recovery': {
    title: '단방향 상태머신 기반 복구 시스템',
    status: '출원 완료',
    category: '복구 시스템 설계',
    summary: '블록체인 자산 복구 프로세스를 단방향 상태머신으로 설계하여, 복구 절차의 각 단계를 되돌릴 수 없도록 제어하는 시스템에 관한 특허입니다.',
    problem: '기존 복구 시스템은 복구 절차 중 중단·재시도·우회가 가능하여 복구 과정에서 보안 취약점이 발생할 수 있습니다. 복구 절차의 원자성과 무결성을 보장하는 메커니즘이 부재합니다.',
    solution: '복구 절차를 단방향으로만 진행되는 상태머신으로 구현하여 각 단계 완료 후 이전 상태로 회귀가 불가능합니다. 단계별 검증을 통해 복구 절차의 무결성을 보장하며, 중간 개입·우회 시도를 원천 차단합니다.',
    points: [
      '복구 절차의 원자성(Atomicity) 보장',
      '단계 역행·우회 불가 구조',
      '각 단계별 검증 메커니즘 내장',
      '커스터디 서비스 복구 프로토콜 표준화',
    ],
  },
  'multi-key-recovery': {
    title: '다중키 오프라인 복구 시스템',
    status: '출원 완료',
    category: '다중서명 복구',
    summary: '다수의 키를 분산 보관하고, 네트워크 연결 없는 오프라인 환경에서 정족수(Threshold) 충족 시에만 복구가 가능한 다중키 복구 시스템에 관한 특허입니다.',
    problem: '단일 키 기반 복구는 키 분실 시 자산 영구 손실, 키 탈취 시 즉각적인 자산 유출 위험을 내포합니다. 네트워크 연결된 환경에서의 복구는 온라인 공격에 노출됩니다.',
    solution: '복구 키를 샤미르 비밀 분산(SSS) 방식으로 다수에게 분산 보관하고, 정족수 이상의 키 소지자가 오프라인 환경에서 협력할 때만 복구가 가능합니다. 네트워크 격리를 통해 원격 공격을 원천 차단합니다.',
    points: [
      '샤미르 비밀 분산 기반 키 분산 보관',
      '정족수(M-of-N) 기반 복구 승인',
      '완전 오프라인 환경에서만 복구 진행',
      '기관급 커스터디에 적합한 거버넌스 구조',
    ],
  },
  'onchain-credential': {
    title: '온체인 TX 기반 역량 인증',
    status: '출원 중',
    category: '온체인 자격 인증',
    summary: '블록체인 트랜잭션(TX) 데이터를 분석하여 사용자의 실제 역량을 객관적으로 검증하고, 이를 위변조 불가능한 온체인 자격증으로 발행하는 시스템에 관한 특허입니다.',
    problem: '기존 자격증·학위는 시험 점수에 의존하며, 실제 블록체인 운용 역량을 객관적으로 증명하는 수단이 없습니다. 종이 자격증은 위변조가 가능하고, 발급 주체에 대한 신뢰 의존도가 높습니다.',
    solution: '실제 온체인 트랜잭션 이력을 분석하여 역량을 정량화하고, 이를 스마트컨트랙트 기반의 NFT 자격증으로 발행합니다. 누구나 블록체인에서 진위 여부를 즉시 검증할 수 있으며, 발급 주체 신뢰에 의존하지 않습니다.',
    points: [
      '온체인 TX 이력 기반 역량 정량화',
      '스마트컨트랙트 기반 자격증 발행',
      '블록체인에서 즉시 진위 검증 가능',
      '탈중앙 신뢰 모델 — 발급 기관 신뢰 불필요',
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PATENTS).map((slug) => ({ slug }));
}

export default async function PatentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const patent = PATENTS[slug];
  if (!patent) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-3xl mx-auto">
          {/* 브레드크럼 */}
          <div className="flex items-center gap-2 text-sm text-cc-muted mb-8">
            <a href="/#patent" className="hover:text-cc-text transition-colors">특허 &amp; 연구</a>
            <span>/</span>
            <span className="text-cc-text">{patent.title}</span>
          </div>

          {/* 헤더 */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                patent.status === '출원 완료'
                  ? 'bg-cc-accent/10 border-cc-accent/40 text-cc-accent'
                  : 'bg-white/5 border-white/20 text-cc-muted'
              }`}>
                {patent.status === '출원 완료' ? '✓ ' : ''}{patent.status}
              </span>
              <span className="text-xs text-cc-muted border border-white/10 px-3 py-1 rounded-full">
                {patent.category}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text leading-snug">
              {patent.title}
            </h1>
          </div>

          <div className="space-y-8">
            {/* 개요 */}
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6">
              <p className="cc-label mb-3">개요</p>
              <p className="text-cc-muted leading-relaxed">{patent.summary}</p>
            </div>

            {/* 문제 */}
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6">
              <p className="cc-label mb-3">해결한 문제</p>
              <p className="text-cc-muted leading-relaxed">{patent.problem}</p>
            </div>

            {/* 해결책 */}
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6">
              <p className="cc-label mb-3">기술적 해결책</p>
              <p className="text-cc-muted leading-relaxed">{patent.solution}</p>
            </div>

            {/* 핵심 포인트 */}
            <div className="bg-cc-secondary border border-white/10 rounded-cc p-6">
              <p className="cc-label mb-4">핵심 특징</p>
              <ul className="space-y-3">
                {patent.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-cc-accent mt-0.5 flex-shrink-0">▸</span>
                    <span className="text-cc-muted">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 안내 */}
            <div className="border border-white/10 rounded-cc p-5 text-center">
              <p className="text-cc-muted text-sm">
                특허 기술 관련 문의 및 라이선스 협의는{' '}
                <a href="mailto:contact@coincraft.io" className="text-cc-accent hover:underline">
                  contact@coincraft.io
                </a>
                으로 연락해 주세요.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
