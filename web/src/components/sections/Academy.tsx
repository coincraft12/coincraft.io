const WP_API = 'https://coincraft.io/wp-json'

type WPCourse = {
  id: number
  title: { rendered: string }
  excerpt: { rendered: string }
  link: string
  meta?: { _lp_price?: string; _lp_students?: string }
}

async function getCourses(): Promise<WPCourse[]> {
  try {
    const res = await fetch(
      `${WP_API}/wp/v2/lp_course?_fields=id,title,excerpt,link&per_page=6&status=publish`,
      { next: { revalidate: 3600 } }
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

const LEVEL_BADGE: Record<string, string> = {
  basic:     'bg-emerald-500/20 text-emerald-400',
  associate: 'bg-blue-500/20 text-blue-400',
  expert:    'bg-purple-500/20 text-purple-400',
}

function getLevelBadge(title: string) {
  const t = title.toLowerCase()
  if (t.includes('basic'))     return { label: 'Basic',     cls: LEVEL_BADGE.basic }
  if (t.includes('associate')) return { label: 'Associate', cls: LEVEL_BADGE.associate }
  if (t.includes('expert'))    return { label: 'Expert',    cls: LEVEL_BADGE.expert }
  return { label: 'Course', cls: 'bg-cc-accent/20 text-cc-accent' }
}

export default async function Academy() {
  const courses = await getCourses()

  return (
    <section id="academy" className="cc-section bg-cc-secondary/30">
      <div className="cc-container">
        <div className="mb-16">
          <p className="cc-label mb-3">ACADEMY</p>
          <h2 className="text-4xl font-bold text-cc-text mb-3">
            Web3 구조설계자 <span className="text-cc-accent">양성 과정</span>
          </h2>
          <p className="text-cc-muted">실무 중심의 단계별 커리큘럼으로 블록체인 전문가로 성장하세요.</p>
        </div>

        {courses.length === 0 ? (
          <div className="cc-glass p-10 text-center text-cc-muted mb-10">
            강의 정보를 불러오는 중입니다.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {courses.map((c) => {
              const { label, cls } = getLevelBadge(c.title.rendered)
              return (
                <a
                  key={c.id}
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-glass p-6 hover:border-cc-accent/40 transition-all duration-300 group block"
                >
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${cls} mb-4 inline-block`}>
                    {label}
                  </span>
                  <h3 className="text-base font-bold text-cc-text mb-2 group-hover:text-cc-accent transition-colors leading-snug">
                    {c.title.rendered}
                  </h3>
                  <p className="text-cc-muted text-sm leading-relaxed mb-4 line-clamp-3">
                    {stripHtml(c.excerpt.rendered)}
                  </p>
                  <span className="text-cc-accent text-sm font-semibold">자세히 보기 →</span>
                </a>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <a href="https://coincraft.io/courses" className="cc-btn cc-btn-primary">
            전체 강의 보기
          </a>
          <a href="https://coincraft.io/cert" className="cc-btn cc-btn-outline">
            자격 검정 안내
          </a>
        </div>
      </div>
    </section>
  )
}
