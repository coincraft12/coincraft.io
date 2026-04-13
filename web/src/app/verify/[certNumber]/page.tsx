import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Badge from '@/components/ui/Badge';

const API_BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4001';

interface CertVerification {
  certNumber: string;
  level: string;
  issuedAt: string;
  expiresAt: string | null;
  holderName: string;
  isValid: boolean;
}

interface VerifyResponse {
  success: boolean;
  data: CertVerification;
}

async function verifyCert(certNumber: string): Promise<CertVerification | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/certificates/${certNumber}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json: VerifyResponse = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

function getLevelLabel(level: string): string {
  const map: Record<string, string> = { basic: 'Basic', associate: 'Associate', expert: 'Expert' };
  return map[level] ?? level.toUpperCase();
}

function getLevelVariant(level: string): 'basic' | 'associate' | 'expert' | 'default' {
  if (level === 'basic') return 'basic';
  if (level === 'associate') return 'associate';
  if (level === 'expert') return 'expert';
  return 'default';
}

export default async function VerifyCertPage({ params }: { params: { certNumber: string } }) {
  const cert = await verifyCert(params.certNumber);

  if (!cert) {
    notFound();
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const expiresDate = cert.expiresAt
    ? new Date(cert.expiresAt).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16 flex items-center justify-center">
        <div className="cc-container max-w-md">
          {/* Verification status */}
          <div
            className={`rounded-cc p-8 text-center mb-6 ${
              cert.isValid
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <div className="text-4xl mb-3">{cert.isValid ? '✅' : '❌'}</div>
            <h1 className="text-xl font-bold text-cc-text mb-1">
              {cert.isValid ? '유효한 자격증입니다' : '만료된 자격증입니다'}
            </h1>
            <p className="text-cc-muted text-sm">CoinCraft 공식 자격 검증 시스템</p>
          </div>

          {/* Cert details */}
          <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-cc-muted mb-1">자격증 종류</p>
                <p className="text-cc-text font-bold text-lg">
                  CoinCraft {getLevelLabel(cert.level)} 자격증
                </p>
              </div>
              <Badge variant={getLevelVariant(cert.level)}>
                {getLevelLabel(cert.level)}
              </Badge>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Holder */}
            <div>
              <p className="text-xs text-cc-muted mb-1">자격증 보유자</p>
              <p className="text-cc-text font-semibold">{cert.holderName}</p>
            </div>

            {/* Cert number */}
            <div>
              <p className="text-xs text-cc-muted mb-1">자격증 번호</p>
              <p className="text-cc-text font-mono font-semibold text-sm">{cert.certNumber}</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-cc-muted mb-1">발급일</p>
                <p className="text-cc-text text-sm">{issuedDate}</p>
              </div>
              {expiresDate && (
                <div>
                  <p className="text-xs text-cc-muted mb-1">유효기간</p>
                  <p className={`text-sm ${cert.isValid ? 'text-cc-text' : 'text-red-400'}`}>
                    {expiresDate}
                  </p>
                </div>
              )}
              {!expiresDate && (
                <div>
                  <p className="text-xs text-cc-muted mb-1">유효기간</p>
                  <p className="text-emerald-400 text-sm">영구</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/exams" className="text-sm text-cc-muted hover:text-cc-accent transition-colors">
              CoinCraft 자격 시험 보러 가기 →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
