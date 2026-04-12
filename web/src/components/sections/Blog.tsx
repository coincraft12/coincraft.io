const WP_API = 'https://coincraft.io/wp-json'

type WPPost = {
  id: number
  title: { rendered: string }
  excerpt: { rendered: string }
  link: string
  date: string
  featured_media: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>
  }
}

async function getPosts(): Promise<WPPost[]> {
  try {
    const res = await fetch(
      `${WP_API}/wp/v2/posts?_fields=id,title,excerpt,link,date,featured_media&_embed=wp:featuredmedia&per_page=3&status=publish`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim()
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function Blog() {
  const posts = await getPosts()

  return (
    <section id="blog" className="cc-section bg-cc-primary">
      <div className="cc-container">
        <div className="text-center mb-16">
          <p className="cc-label mb-3">INSIGHTS</p>
          <h2 className="text-4xl font-bold text-cc-text">
            최신 <span className="text-cc-accent">콘텐츠</span>
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="cc-glass p-10 text-center text-cc-muted mb-10">
            콘텐츠를 불러오는 중입니다.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {posts.map((p) => {
              const thumb = p._embedded?.['wp:featuredmedia']?.[0]?.source_url
              return (
                <a
                  key={p.id}
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-glass hover:border-cc-accent/40 transition-all duration-300 group block overflow-hidden"
                >
                  <div
                    className="h-44 bg-cc-accent/5 flex items-center justify-center"
                    style={thumb ? { backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {!thumb && <span className="text-4xl opacity-20">📄</span>}
                  </div>
                  <div className="p-6">
                    <span className="text-xs text-cc-muted">{formatDate(p.date)}</span>
                    <h4 className="text-base font-bold text-cc-text mt-2 mb-2 group-hover:text-cc-accent transition-colors leading-snug line-clamp-2">
                      {p.title.rendered}
                    </h4>
                    <p className="text-cc-muted text-sm leading-relaxed line-clamp-3">
                      {stripHtml(p.excerpt.rendered)}
                    </p>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        <div className="text-center">
          <a href="https://coincraft.io/blog" className="cc-btn cc-btn-ghost">
            전체 글 보기
          </a>
        </div>
      </div>
    </section>
  )
}
