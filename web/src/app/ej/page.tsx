import type { Metadata } from 'next';
import ProfilePhoto from './ProfilePhoto';

export const metadata: Metadata = {
  title: 'EJ Kim — CoinCraft',
  description: 'Founder & CEO at CoinCraft. Web3 Research · Education · Publishing.',
};

const LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/coincraft-inc',
    icon: '↗',
    description: 'CoinCraft on LinkedIn',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/channel/UCT7SwOLZfnx-1zxAprRTQNg',
    icon: '↗',
    description: 'Web3 & onchain content',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/coincraft.labs/',
    icon: '↗',
    description: '@coincraft.labs',
  },
  {
    label: 'CoinCraft',
    href: 'https://coincraft.io',
    icon: '↗',
    description: 'Official website',
  },
  {
    label: 'Courses',
    href: 'https://coincraft.io/courses',
    icon: '↗',
    description: 'Structured Web3 learning',
  },
  {
    label: 'Contact',
    href: 'mailto:ej@coincraft.io',
    icon: '✉',
    description: 'ej@coincraft.io',
  },
];

const FOCUS_AREAS = [
  {
    title: 'Research',
    desc: 'Onchain analysis, market structure, and Web3 ecosystem research',
  },
  {
    title: 'Education',
    desc: 'Courses, structured learning, and practical Web3 knowledge',
  },
  {
    title: 'Publishing',
    desc: 'Books, articles, and long-term intellectual assets',
  },
];

export default function EJPage() {
  return (
    <main className="min-h-screen bg-cc-primary flex flex-col items-center px-5 py-14">
      <div className="w-full max-w-sm flex flex-col gap-10">

        {/* ── Hero ── */}
        <section className="flex flex-col items-center text-center gap-4">
          <ProfilePhoto />
          <div>
            <h1 className="text-3xl font-bold text-cc-text tracking-tight">EJ Kim</h1>
            <p className="text-cc-muted text-sm mt-0.5">김응준</p>
          </div>
          <div>
            <p className="text-cc-accent font-semibold text-sm tracking-wide">Founder & CEO, CoinCraft</p>
            <p className="text-cc-muted text-sm mt-1">Web3 Research · Education · Publishing</p>
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section className="flex flex-col gap-3">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="cc-glass flex items-center justify-between px-5 py-4 rounded-xl hover:border-cc-accent/40 hover:bg-white/[0.07] transition-all group"
            >
              <div>
                <p className="text-cc-text font-semibold text-sm group-hover:text-cc-accent transition-colors">
                  {link.label}
                </p>
                <p className="text-cc-muted text-xs mt-0.5">{link.description}</p>
              </div>
              <span className="text-cc-accent text-lg">{link.icon}</span>
            </a>
          ))}
        </section>

        {/* ── About ── */}
        <section className="cc-glass p-6 rounded-xl">
          <p className="cc-label mb-3">About</p>
          <p className="text-cc-muted text-sm leading-relaxed">
            EJ Kim은 CoinCraft의 창업자입니다.<br />
            CoinCraft는 Web3 리서치, 교육, 출판을 중심으로 움직이는 브랜드입니다.<br />
            어렵고 낯선 Web3를 더 쉽게 이해하고, 실제로 배울 수 있도록
            구조화된 콘텐츠와 학습 경험을 만드는 데 집중하고 있습니다.
          </p>
        </section>

        {/* ── Focus Areas ── */}
        <section>
          <p className="cc-label mb-4">Focus Areas</p>
          <div className="flex flex-col gap-3">
            {FOCUS_AREAS.map((area) => (
              <div key={area.title} className="cc-glass px-5 py-4 rounded-xl flex gap-4 items-start">
                <span className="text-cc-accent font-bold text-sm mt-0.5 w-24 shrink-0">{area.title}</span>
                <p className="text-cc-muted text-xs leading-relaxed">{area.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="text-center">
          <p className="text-cc-muted text-xs">
            <a href="https://coincraft.io" className="hover:text-cc-accent transition-colors">
              coincraft.io
            </a>
          </p>
        </footer>

      </div>
    </main>
  );
}
