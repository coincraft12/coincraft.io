'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';

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
      { label: '종이책', href: '/shop' },
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
];

interface ExamRegistration {
  id: string; examId: string; registrationNumber: string; examTitle: string; examLevel: string;
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [myExams, setMyExams] = useState<ExamRegistration[]>([]);
  const { user, accessToken, logout, isLoading } = useAuthStore();
  const pathname = usePathname();
  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!accessToken) { setMyExams([]); return; }
    apiClient.get<{ success: boolean; data: ExamRegistration[] }>(
      '/api/v1/users/me/exam-registrations', { token: accessToken }
    ).then((res) => setMyExams(res.data)).catch(() => {});
  }, [accessToken]);

  const nav = BASE_NAV.map((item) => {
    if (item.label !== '검정' || !item.children) return item;
    let certChildren: { label: string; href: string }[] = [...item.children];
    if (myExams.length > 0) {
      const latest = myExams[myExams.length - 1];
      certChildren = certChildren.filter((c) => c.label !== '검정 신청');
      certChildren.unshift({ label: '나의 검정', href: `/exams/${latest.examId}` });
    }
    return { ...item, children: certChildren };
  });

  async function handleLogout() {
    try { await apiClient.post('/api/v1/auth/logout', {}, { token: accessToken ?? undefined }); } catch {}
    logout();
    localStorage.removeItem('cc_access_token');
    window.location.reload();
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#1a1a2e]/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/8' : 'bg-[#1a1a2e] border-b border-white/10'}`}>
        <div className="max-w-cc mx-auto px-4 sm:px-6 flex items-center justify-between h-16 relative">
          {/* Logo — centered on mobile via absolute, left-aligned on desktop via static */}
          <a href="/" className="flex items-center h-10 flex-shrink-0 absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0" onClick={() => setMobileOpen(false)}>
            <Image src="/logo-header-v4.png" alt="COINCRAFT" width={160} height={40} className="h-9 w-auto object-contain" />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6">
            {nav.map((item) =>
              item.children ? (
                <div key={item.label} className="relative group">
                  <a href={item.href} className="text-sm text-cc-muted hover:text-cc-text transition-colors flex items-center gap-1 py-2">
                    {item.label}
                    <span className="text-xs opacity-50">▾</span>
                  </a>
                  <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50">
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-cc py-1.5 min-w-[180px] shadow-xl shadow-black/30">
                      {item.children.map((c) => (
                        <a key={c.label} href={c.href} className="block px-4 py-2.5 text-sm text-cc-muted hover:text-cc-text hover:bg-white/5 transition-colors">
                          {c.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <a key={item.label} href={item.href} className="text-sm text-cc-muted hover:text-cc-text transition-colors py-2">
                  {item.label}
                </a>
              )
            )}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <a href="/my" className="flex items-center gap-2 text-sm text-cc-muted hover:text-cc-text transition-colors border border-white/20 hover:border-white/40 rounded-full pl-1 pr-3 py-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-cc-accent/20 border border-cc-accent/40 flex-shrink-0 flex items-center justify-center">
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-cc-accent">{user.name.charAt(0).toUpperCase()}</span>}
                  </div>
                  <span className="max-w-[80px] truncate">{user.name}</span>
                </a>
                {(user.role === 'admin' || user.role === 'instructor') && (
                  <a href="/instructor" className="text-sm text-cc-accent hover:text-cc-accent/80 transition-colors">강사 포털</a>
                )}
                {user.role === 'admin' && (
                  <a href="/admin" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">관리자</a>
                )}
                <button onClick={handleLogout} className="cc-btn cc-btn-primary text-sm px-4 py-2">로그아웃</button>
              </>
            ) : !isLoading ? (
              <>
                <a href="/register" className="text-sm text-cc-muted hover:text-cc-text transition-colors">회원가입</a>
                <a href={loginHref} className="cc-btn cc-btn-primary text-sm px-4 py-2">로그인</a>
              </>
            ) : null}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-11 h-11 gap-[5px] -mr-2 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴"
          >
            <span className={`block w-5 h-0.5 bg-cc-text transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-cc-text transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-cc-text transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile menu — full-screen overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(10,10,15,0.96)', backdropFilter: 'blur(12px)' }}
      >
        <div className={`h-full flex flex-col pt-20 px-6 pb-8 overflow-y-auto transition-all duration-300 ${mobileOpen ? 'translate-y-0' : '-translate-y-4'}`}>

          {/* Nav items */}
          <nav className="flex-1">
            {nav.map((item) => (
              <div key={item.label} className="border-b border-white/8">
                {item.children ? (
                  <>
                    <button
                      className="w-full flex items-center justify-between py-4 text-base font-medium text-cc-text"
                      onClick={() => setOpenSub(openSub === item.label ? null : item.label)}
                    >
                      {item.label}
                      <span className={`text-cc-muted transition-transform duration-200 ${openSub === item.label ? 'rotate-180' : ''}`}>▾</span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-200 ${openSub === item.label ? 'max-h-48' : 'max-h-0'}`}>
                      <div className="pb-3 pl-3 space-y-1">
                        {item.children.map((c) => (
                          <a
                            key={c.label}
                            href={c.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 py-2.5 text-sm text-cc-muted hover:text-cc-accent transition-colors"
                          >
                            <span className="w-1 h-1 rounded-full bg-cc-accent/50 flex-shrink-0" />
                            {c.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center py-4 text-base font-medium text-cc-text hover:text-cc-accent transition-colors"
                  >
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </nav>

          {/* Auth section */}
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            {user ? (
              <>
                <a href="/my" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-cc-accent/20 border border-cc-accent/40 flex items-center justify-center flex-shrink-0">
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-cc-accent">{user.name.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cc-text truncate">{user.name}</p>
                    <p className="text-xs text-cc-muted truncate">{user.email}</p>
                  </div>
                </a>
                {(user.role === 'admin' || user.role === 'instructor') && (
                  <a href="/instructor" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-cc-accent/30 text-cc-accent text-sm font-medium">
                    강사 포털
                  </a>
                )}
                {user.role === 'admin' && (
                  <a href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-yellow-400/30 text-yellow-400 text-sm font-medium">
                    관리자 대시보드
                  </a>
                )}
                <button onClick={handleLogout} className="w-full cc-btn cc-btn-primary py-3 text-sm">로그아웃</button>
              </>
            ) : !isLoading ? (
              <div className="flex flex-col gap-3">
                <a href={loginHref} onClick={() => setMobileOpen(false)} className="w-full cc-btn cc-btn-primary py-3.5 text-center text-sm font-semibold">로그인</a>
                <a href="/register" onClick={() => setMobileOpen(false)} className="w-full cc-btn cc-btn-ghost py-3.5 text-center text-sm font-semibold">회원가입</a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
