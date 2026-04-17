import Link from 'next/link';
import Badge from '@/components/ui/Badge';

interface CertificateCardProps {
  id: string;
  certNumber: string;
  level: string;
  issuedAt: string;
  expiresAt: string | null;
}

function getLevelLabel(level: string): string {
  const map: Record<string, string> = {
    basic: 'Basic',
    associate: 'Associate',
    professional: 'Professional',
    expert: 'Expert',
  };
  return map[level] ?? level;
}

function getLevelVariant(level: string): 'basic' | 'associate' | 'expert' | 'default' {
  if (level === 'basic') return 'basic';
  if (level === 'associate') return 'associate';
  if (level === 'professional' || level === 'expert') return 'expert';
  return 'default';
}

export default function CertificateCard({
  certNumber,
  level,
  issuedAt,
  expiresAt,
}: CertificateCardProps) {
  const issuedDate = new Date(issuedAt).toLocaleDateString('ko-KR');
  const expiresDate = expiresAt ? new Date(expiresAt).toLocaleDateString('ko-KR') : null;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <div className="bg-cc-secondary border border-white/10 rounded-cc p-6 space-y-4 hover:border-cc-accent/30 transition-colors">
      {/* Level badge and cert icon */}
      <div className="flex items-center justify-between">
        <Badge variant={getLevelVariant(level)}>
          CoinCraft {getLevelLabel(level)}
        </Badge>
        {isExpired && (
          <Badge variant="danger">만료됨</Badge>
        )}
      </div>

      {/* Cert number */}
      <div>
        <p className="text-xs text-cc-muted mb-1">자격증 번호</p>
        <p className="text-cc-text font-mono font-semibold text-sm">{certNumber}</p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-cc-muted mb-0.5">발급일</p>
          <p className="text-cc-text">{issuedDate}</p>
        </div>
        {expiresDate && (
          <div>
            <p className="text-xs text-cc-muted mb-0.5">유효기간</p>
            <p className={isExpired ? 'text-red-400' : 'text-cc-text'}>{expiresDate}</p>
          </div>
        )}
      </div>

      {/* Verify link */}
      <Link
        href={`/verify/${certNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center px-4 py-2 text-sm border border-white/20 text-cc-muted rounded hover:border-cc-accent/40 hover:text-cc-accent transition-colors"
      >
        공개 검증 링크
      </Link>
    </div>
  );
}
