import Link from 'next/link';
import Image from 'next/image';
import type { PostListItem } from '@/lib/blog';

interface PostCardProps {
  post: PostListItem;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="cc-glass overflow-hidden transition-all duration-300 group-hover:border-cc-accent/40 group-hover:-translate-y-1">
        <div className="relative aspect-video bg-cc-secondary overflow-hidden">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-20">📝</span>
            </div>
          )}
        </div>

        <div className="p-4">
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-cc-accent/20 text-cc-accent"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-semibold text-cc-text text-sm leading-snug mb-2 line-clamp-2 group-hover:text-cc-accent transition-colors">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-cc-muted text-xs line-clamp-3 mb-3">{post.excerpt}</p>
          )}

          <div className="flex items-center justify-between text-xs text-cc-muted">
            {post.author && <span>{post.author.name}</span>}
            <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
