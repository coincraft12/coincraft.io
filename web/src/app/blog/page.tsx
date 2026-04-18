import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import PostCard from '@/components/blog/post-card';
import { fetchPosts, fetchCategories } from '@/lib/blog';

export const metadata = { title: '블로그 — COINCRAFT' };
export const revalidate = 300;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const queryParams: Record<string, string> = {};
  if (params.category) queryParams.category = params.category;
  if (params.tag) queryParams.tag = params.tag;
  if (params.q) queryParams.q = params.q;
  if (params.page) queryParams.page = params.page;

  const [{ data: posts, meta }, categories] = await Promise.all([
    fetchPosts(queryParams),
    fetchCategories(),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cc-primary pt-24 pb-16">
        <div className="cc-container">
          <div className="mb-10">
            <p className="cc-label mb-2">BLOG</p>
            <h1 className="text-3xl md:text-4xl font-bold text-cc-text">블로그</h1>
            <p className="text-cc-muted mt-2">Web3 · 블록체인 기술 인사이트</p>
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <a
                href="/blog"
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  !params.category
                    ? 'bg-cc-accent text-cc-primary border-cc-accent'
                    : 'border-white/10 text-cc-muted hover:border-cc-accent hover:text-cc-accent'
                }`}
              >
                전체
              </a>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    params.category === cat.slug
                      ? 'bg-cc-accent text-cc-primary border-cc-accent'
                      : 'border-white/10 text-cc-muted hover:border-cc-accent hover:text-cc-accent'
                  }`}
                >
                  {cat.name}
                </a>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">📝</p>
              <p className="text-cc-muted">아직 게시된 포스트가 없습니다.</p>
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
                      href={`?page=${p}${params.category ? `&category=${params.category}` : ''}`}
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
