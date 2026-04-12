'use client'
import { useState, useEffect } from 'react'

const WP_BASE = process.env.NEXT_PUBLIC_WP_URL ?? 'https://coincraft.io'
const LOGO = `${WP_BASE}/wp-content/uploads/2026/01/COINCRAFT_IO_헤더로고-복사.png`

const nav = [
  { label: 'HOME', href: '/' },
  { label: 'ABOUT', href: '/about/' },
  {
    label: '전체 강좌',
    href: '#',
    children: [
      { label: 'Web3', href: `${WP_BASE}/course-category/web3/` },
      { label: '온체인 데이터 분석', href: `${WP_BASE}/course-category/onchain-data/` },
    ],
  },
  {
    label: '검정',
    href: `${WP_BASE}/cert/`,
    children: [
      { label: '검정 신청', href: `${WP_BASE}/cert/application/` },
      { label: '자격 관리·운영 규정', href: `${WP_BASE}/cert/policy/` },
      { label: '시험 관리 세부 규정', href: `${WP_BASE}/cert/exam-rules/` },
    ],
  },
  { label: '상점', href: `${WP_BASE}/shop/` },
]

function isWpLoggedIn(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim().startsWith('wordpress_logged_in_'))
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSub, setOpenSub] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(isWpLoggedIn())
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e] border-b border-white/10">
      <div className="max-w-cc mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="/" className="flex items-center h-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="COINCRAFT" className="h-8 w-auto object-contain" />
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
                      <a
                        key={c.label}
                        href={c.href}
                        className="block px-4 py-2 text-sm text-cc-muted hover:text-cc-text hover:bg-white/5 transition-colors"
                      >
                        {c.label}
                      </a>
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
          {loggedIn ? (
            <a href={`${WP_BASE}/account/`} className="cc-btn cc-btn-primary text-sm px-4 py-2">
              내 계정
            </a>
          ) : (
            <>
              <a href={`${WP_BASE}/account/?action=register`} className="text-sm text-cc-muted hover:text-cc-text transition-colors">
                회원가입
              </a>
              <a href={`${WP_BASE}/account/`} className="cc-btn cc-btn-primary text-sm px-4 py-2">
                로그인
              </a>
            </>
          )}
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
            {loggedIn ? (
              <a href={`${WP_BASE}/account/`} className="cc-btn cc-btn-primary text-sm px-4 py-2">내 계정</a>
            ) : (
              <>
                <a href={`${WP_BASE}/account/?action=register`} className="text-sm text-cc-muted">회원가입</a>
                <a href={`${WP_BASE}/account/`} className="cc-btn cc-btn-primary text-sm px-4 py-2">로그인</a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
