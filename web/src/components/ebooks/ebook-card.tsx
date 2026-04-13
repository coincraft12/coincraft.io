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
}

export default function EbookCard({
  id,
  title,
  description,
  coverImageUrl,
  price,
  isFree,
  pageCount,
}: EbookCardProps) {
  return (
    <Link href={`/ebooks/${id}`} className="group block">
      <div className="cc-glass overflow-hidden transition-all duration-300 group-hover:border-cc-accent/40 group-hover:-translate-y-1">
        {/* Cover */}
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

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {isFree ? (
              <Badge variant="success">무료</Badge>
            ) : (
              <Badge variant="default">유료</Badge>
            )}
          </div>

          <h3 className="font-semibold text-cc-text text-sm leading-snug mb-1 line-clamp-2 group-hover:text-cc-accent transition-colors">
            {title}
          </h3>

          {description && (
            <p className="text-cc-muted text-xs line-clamp-2 mb-3">{description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-cc-muted">
              {pageCount ? `${pageCount}페이지` : 'EPUB'}
            </div>
            <span className="font-bold text-cc-accent text-sm">
              {isFree ? '무료' : `₩${Number(price).toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
