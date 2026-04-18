import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import MarkdownContent from '@/components/ui/MarkdownContent';
import { fetchPostBySlug, fetchPosts } from '@/lib/blog';

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return { title: '포스트 없음 — COINCRAFT' };
  return {
    title: `${post.title} — COINCRAFT`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container max-w-3xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-xs text-cc-muted flex items-center gap-2">
            <Link href="/blog" className="hover:text-cc-accent transition-colors">블로그</Link>
            <span>/</span>
            {post.categories[0] && (
              <>
                <Link
                  href={`/blog/category/${post.categories[0].slug}`}
                  className="hover:text-cc-accent transition-colors"
                >
                  {post.categories[0].name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-cc-text line-clamp-1">{post.title}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/blog/category/${cat.slug}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-cc-accent/20 text-cc-accent hover:bg-cc-accent/30 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-cc-text mb-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-cc-muted">
              {post.author && <span>{post.author.name}</span>}
              <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
            </div>
          </header>

          {/* Cover image */}
          {post.coverImage && (
            <div className="relative w-full aspect-video rounded-cc overflow-hidden mb-8">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          {post.content ? (
            <article
              className="prose prose-invert prose-sm max-w-none
                prose-headings:text-cc-text prose-headings:font-bold
                prose-p:text-cc-muted prose-p:leading-relaxed
                prose-a:text-cc-accent prose-a:no-underline hover:prose-a:underline
                prose-code:text-cc-accent prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
                prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10
                prose-blockquote:border-cc-accent prose-blockquote:text-cc-muted
                prose-strong:text-cc-text
                prose-hr:border-white/10
                prose-img:rounded-cc"
            >
              <MarkdownContent content={post.content} />
            </article>
          ) : (
            <p className="text-cc-muted">본문이 없습니다.</p>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-white/10">
              <p className="text-xs text-cc-muted mb-3 font-medium">태그</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog?tag=${tag.slug}`}
                    className="px-3 py-1 rounded-full text-xs border border-white/10 text-cc-muted hover:border-cc-accent hover:text-cc-accent transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back */}
          <div className="mt-10">
            <Link href="/blog" className="cc-btn cc-btn-ghost text-sm">← 블로그 목록</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
