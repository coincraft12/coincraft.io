'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@/lib/api-client'

const BASE_NAV = [
  { label: 'HOME', href: '/' },
  { label: 'ABOUT', href: '/about' },
  { label: '전체 강좌', href: '/courses' },
  {
    label: '검정',
    href: '/cert',
    children: [
      { label: '검정 신청', href: '/cert/apply' },
      { label: '자격 관리·운영 규정', href: '/cert/policy' },
      { label: '시험 관리 세부 규정', href: '/cert/exam-rules' },
    ],
  },
  {
    label: '상점',
    href: '/shop',
    children: [
      { label: '전자책', href: '/ebooks' },
      { label: '종이책 (준비중)', href: '/shop', disabled: true },
    ],
  },
  {
    label: '강사',
    href: '/instructors',
    children: [
      { label: '강사진 소개', href: '/instructors' },
      { label: '강사 등록 신청', href: '/instructors/apply' },
    ],
  },
]

interface ExamRegistration {
  id: string;
  examId: string;
  registrationNumber: string;
  examTitle: string;
  examLevel: string;
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSub, setOpenSub] = useState<string | null>(null)
  const [myExams, setMyExams] = useState<ExamRegistration[]>([])
  const { user, accessToken, logout, isLoading } = useAuthStore()
  const pathname = usePathname()
  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`

  useEffect(() => {
    if (!accessToken) { setMyExams([]); return; }
    apiClient.get<{ success: boolean; data: ExamRegistration[] }>(
      '/api/v1/users/me/exam-registrations',
      { token: accessToken }
    ).then((res) => setMyExams(res.data)).catch(() => {})
  }, [accessToken])

  const nav = BASE_NAV.map((item) => {
    if (item.label !== '검정' || !item.children) return item;
    const certChildren: { label: string; href: string; disabled?: boolean }[] = [...item.children];
    if (myExams.length > 0) {
      const latest = myExams[myExams.length - 1];
      certChildren.unshift({ label: '나의 검정', href: `/exams/${latest.examId}` });
    }
    return { ...item, children: certChildren };
  })

  async function handleLogout() {
    try {
      await apiClient.post('/api/v1/auth/logout', {}, { token: accessToken ?? undefined })
    } catch {}
    logout()
    localStorage.removeItem('cc_access_token')
    window.location.reload()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e] border-b border-white/10">
      <div className="max-w-cc mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="/" className="flex items-center h-10">
          <Image src="/logo-header-v4.png" alt="COINCRAFT" width={160} height={40} className="h-10 w-auto object-contain" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map((item) =>
            item.children ? (
              <div key={item.label} className="relative group">
                <a
                  href={item.href}
                  className="text-sm text-cc-muted hover:text-cc-text transition-colors flex items-center gap-1"
                >
                  {item.label}
                  <span className="text-xs opacity-60">▾</span>
                </a>
                {/* Dropdown */}
                <div className="absolute top-full left-0 pt-2 hidden group-hover:block">
                  <div className="bg-[#1a1a2e] border border-white/10 rounded-cc py-2 min-w-[180px] shadow-lg">
                    {item.children.map((c) => (
                      c.disabled ? (
                        <span
                          key={c.label}
                          className="block px-4 py-2 text-sm text-cc-muted/40 cursor-default"
                        >
                          {c.label}
                        </span>
                      ) : (
                      <a
                        key={c.label}
                        href={c.href}
                        className="block px-4 py-2 text-sm text-cc-muted hover:text-cc-text hover:bg-white/5 transition-colors"
                      >
                        {c.label}
                      </a>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-cc-muted hover:text-cc-text transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Auth links */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoading && user ? (
            <>
              <a href="/my/courses" className="text-sm text-cc-muted hover:text-cc-text transition-colors">
                {user.name}
              </a>
              {(user.role === 'admin' || user.role === 'instructor') && (
                <a href="/instructor" className="text-sm text-cc-accent hover:text-cc-accent/80 transition-colors">
                  강사 포털
                </a>
              )}
              <button onClick={handleLogout} className="cc-btn cc-btn-primary text-sm px-4 py-2">
                로그아웃
              </button>
            </>
          ) : !isLoading ? (
            <>
              <a href="/register" className="text-sm text-cc-muted hover:text-cc-text transition-colors">
                회원가입
              </a>
              <a href={loginHref} className="cc-btn cc-btn-primary text-sm px-4 py-2">
                로그인
              </a>
            </>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-cc-text"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴"
        >
          <div className="w-5 space-y-1.5">
            <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#1a1a2e] border-t border-white/10 px-6 py-4">
          {nav.map((item) => (
            <div key={item.label}>
              <button
                className="w-full text-left py-3 text-cc-muted hover:text-cc-text text-sm flex justify-between"
                onClick={() => {
                  if (item.children) {
                    setOpenSub(openSub === item.label ? null : item.label)
                  } else {
                    setMobileOpen(false)
                    window.location.href = item.href
                  }
                }}
              >
                {item.label}
                {item.children && <span className="text-xs">{openSub === item.label ? '▲' : '▾'}</span>}
              </button>
              {item.children && openSub === item.label && (
                <div className="pl-4 pb-2">
                  {item.children.map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      className="block py-2 text-sm text-cc-muted hover:text-cc-text"
                      onClick={() => setMobileOpen(false)}
                    >
                      {c.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-3 border-t border-white/10 mt-2">
            {user ? (
              <>
                <a href="/my/courses" className="text-sm text-cc-muted">{user.name}</a>
                {(user.role === 'admin' || user.role === 'instructor') && (
                  <a href="/instructor" className="text-sm text-cc-accent">강사 포털</a>
                )}
                <button onClick={handleLogout} className="cc-btn cc-btn-primary text-sm px-4 py-2">로그아웃</button>
              </>
            ) : (
              <>
                <a href="/register" className="text-sm text-cc-muted">회원가입</a>
                <a href={loginHref} className="cc-btn cc-btn-primary text-sm px-4 py-2">로그인</a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
