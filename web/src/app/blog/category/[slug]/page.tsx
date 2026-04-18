import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import PostCard from '@/components/blog/post-card';
import { fetchPosts, fetchCategories } from '@/lib/blog';

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await fetchCategories();
  const cat = categories.find((c) => c.slug === slug);
  return {
    title: cat ? `${cat.name} — COINCRAFT 블로그` : '카테고리 — COINCRAFT 블로그',
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const queryParams: Record<string, string> = { category: slug };
  if (sp.page) queryParams.page = sp.page;

  const [{ data: posts, meta }, categories] = await Promise.all([
    fetchPosts(queryParams),
    fetchCategories(),
  ]);

  const currentCategory = categories.find((c) => c.slug === slug);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-8">
            <nav className="mb-4 text-xs text-cc-muted flex items-center gap-2">
              <Link href="/blog" className="hover:text-cc-accent transition-colors">블로그</Link>
              <span>/</span>
              <span className="text-cc-text">{currentCategory?.name ?? slug}</span>
            </nav>
            <p className="cc-label mb-2">CATEGORY</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">
              {currentCategory?.name ?? slug}
            </h1>
            {meta.total > 0 && (
              <p className="text-cc-muted mt-2">총 {meta.total}개의 포스트</p>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">📝</p>
              <p className="text-cc-muted">이 카테고리에 포스트가 없습니다.</p>
              <Link href="/blog" className="cc-btn cc-btn-ghost mt-6 inline-block">← 전체 블로그</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`?page=${p}`}
                      className={`w-9 h-9 flex items-center justify-center rounded-cc text-sm transition-colors ${
                        p === meta.page
                          ? 'bg-cc-accent text-cc-primary font-bold'
                          : 'border border-white/10 text-cc-muted hover:border-cc-accent hover:text-cc-accent'
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
