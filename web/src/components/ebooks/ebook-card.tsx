import Link from 'next/link';
import Badge from '@/components/ui/Badge';

export interface EbookCardProps {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  price: string;
  isFree: boolean;
  pageCount: number | null;
  hasPurchased?: boolean;
}

export default function EbookCard({
  id,
  title,
  description,
  coverImageUrl,
  price,
  isFree,
  pageCount,
  hasPurchased,
}: EbookCardProps) {
  const isPaid = !isFree;
  const canRead = isFree || hasPurchased;

  return (
    <div className="group block">
      <div className="cc-glass overflow-hidden transition-all duration-300 group-hover:border-cc-accent/40 group-hover:-translate-y-1">
        {/* Cover */}
        <Link href={`/ebooks/${id}`}>
          <div className="relative aspect-[3/4] bg-cc-secondary overflow-hidden">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl opacity-30">📖</span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {isFree ? (
              <Badge variant="success">무료</Badge>
            ) : hasPurchased ? (
              <Badge variant="success">구매완료</Badge>
            ) : (
              <Badge variant="default">유료</Badge>
            )}
          </div>

          <Link href={`/ebooks/${id}`}>
            <h3 className="font-semibold text-cc-text text-sm leading-snug mb-1 line-clamp-2 group-hover:text-cc-accent transition-colors">
              {title}
            </h3>
          </Link>

          {description && (
            <p className="text-cc-muted text-xs line-clamp-2 mb-3">{description}</p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-cc-muted">
              {pageCount ? `${pageCount}페이지` : 'EPUB'}
            </div>
            <span className="font-bold text-cc-accent text-sm">
              {isFree ? '무료' : `₩${Number(price).toLocaleString()}`}
            </span>
          </div>

          {isPaid && !hasPurchased && (
            <Link
              href={`/checkout/ebook/${id}`}
              className="block w-full text-center text-xs font-semibold py-2 rounded bg-cc-accent text-white hover:bg-cc-accent/80 transition-colors"
            >
              구매하기
            </Link>
          )}
          {canRead && (
            <Link
              href={`/ebooks/${id}`}
              className="block w-full text-center text-xs font-semibold py-2 rounded border border-white/20 text-cc-muted hover:text-cc-text hover:border-white/40 transition-colors"
            >
              읽기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
