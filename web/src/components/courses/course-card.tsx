import Link from 'next/link';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';

interface CourseCardProps {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: string;
  category: string | null;
  price: string;
  isFree: boolean;
  totalLessons: number;
  totalDuration: number;
  averageRating: string | null;
  reviewCount: number;
  instructor: { id: string; name: string; avatarUrl: string | null } | null;
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
  slug, title, shortDescription, thumbnailUrl, level, price, isFree,
  totalLessons, totalDuration, averageRating, reviewCount, instructor,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${slug}`} className="group block">
      <div className="cc-glass overflow-hidden transition-all duration-300 group-hover:border-cc-accent/40 group-hover:-translate-y-1">
        <div className="relative aspect-video bg-cc-secondary overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-30">🎓</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={LEVEL_VARIANTS[level] ?? 'default'}>{LEVEL_LABELS[level] ?? level}</Badge>
            {isFree && <Badge variant="success">무료</Badge>}
          </div>

          <h3 className="font-semibold text-cc-text text-sm leading-snug mb-1 line-clamp-2 group-hover:text-cc-accent transition-colors">
            {title}
          </h3>

          {shortDescription && (
            <p className="text-cc-muted text-xs line-clamp-2 mb-3">{shortDescription}</p>
          )}

          {instructor && (
            <p className="text-cc-muted text-xs mb-3">강사: {instructor.name}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-cc-muted">
              <span>{totalLessons}강</span>
              {totalDuration > 0 && <span>{formatDuration(totalDuration)}</span>}
              {reviewCount > 0 && (
                <span>⭐ {parseFloat(averageRating ?? '0').toFixed(1)} ({reviewCount})</span>
              )}
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
