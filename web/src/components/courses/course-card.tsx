import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import WishlistHeart from '@/components/courses/wishlist-heart';

interface CourseCardProps {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: string;
  category: string | null;
  price: string;
  originalPrice?: string | null;
  isFree: boolean;
  totalLessons: number;
  totalDuration: number;
  averageRating: string | null;
  reviewCount: number;
  instructor: { id: string; name: string; avatarUrl: string | null; bio?: string | null; specialties?: string[] | null; photoUrl?: string | null } | null;
  showWishlist?: boolean;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

const LEVEL_VARIANTS: Record<string, 'basic' | 'associate' | 'expert'> = {
  beginner: 'basic',
  intermediate: 'associate',
  advanced: 'expert',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

export default function CourseCard({
  id, slug, title, shortDescription, thumbnailUrl, level, price, originalPrice, isFree,
  totalLessons, totalDuration, averageRating, reviewCount, instructor, showWishlist = true,
}: CourseCardProps) {
  const discountRate =
    originalPrice && Number(originalPrice) > 0 && Number(price) < Number(originalPrice)
      ? Math.round((1 - Number(price) / Number(originalPrice)) * 100)
      : null;
  return (
    <Link href={`/courses/${slug}`} className="group block h-full">
      <div className="cc-glass overflow-hidden transition-all duration-300 group-hover:border-cc-accent/40 group-hover:-translate-y-1 h-full flex flex-col">
        <div className="relative aspect-video bg-cc-secondary overflow-hidden flex-shrink-0">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-30">🎓</span>
            </div>
          )}
          {showWishlist && <WishlistHeart courseId={id} />}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={LEVEL_VARIANTS[level] ?? 'default'}>{LEVEL_LABELS[level] ?? level}</Badge>
            {isFree && <Badge variant="success">무료</Badge>}
          </div>

          <h3 className="font-semibold text-cc-text text-sm leading-snug mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-cc-accent transition-colors">
            {title}
          </h3>

          {shortDescription && (
            <p className="text-cc-muted text-xs line-clamp-2 mb-3 min-h-[2rem]">{shortDescription}</p>
          )}

          {instructor && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-5 h-5 rounded-full bg-cc-accent/20 border border-cc-accent/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {instructor.avatarUrl || instructor.photoUrl ? (
                  <img
                    src={instructor.avatarUrl ?? instructor.photoUrl ?? ''}
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-3 h-3 text-cc-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                )}
              </div>
              <span className="text-cc-muted text-xs">{instructor.name}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-3">
            <div className="flex items-center gap-3 text-xs text-cc-muted">
              <span>{totalLessons}강</span>
              {totalDuration > 0 && <span>{formatDuration(totalDuration)}</span>}
              {reviewCount > 0 && (
                <span>⭐ {parseFloat(averageRating ?? '0').toFixed(1)} ({reviewCount})</span>
              )}
            </div>
            <div className="flex flex-col items-end">
              {isFree ? (
                <span className="font-bold text-cc-accent text-sm">무료</span>
              ) : (
                <>
                  {discountRate !== null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-cc-muted line-through">
                        ₩{Number(originalPrice).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-red-400">{discountRate}%</span>
                    </div>
                  )}
                  <span className="font-bold text-cc-accent text-sm">
                    ₩{Number(price).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
