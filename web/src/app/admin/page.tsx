'use client';

import Link from 'next/link';

const MENU_CARDS = [
  {
    href: '/admin/enroll',
    title: '무료 입과',
    desc: '특정 사용자를 강좌에 무료로 입과시킵니다.',
    icon: '🎓',
  },
  {
    href: '/admin/payments',
    title: '결제 관리',
    desc: '전체 결제 내역 조회 및 무통장 입금 승인.',
    icon: '💳',
  },
  {
    href: '/admin/book-orders',
    title: '도서 주문',
    desc: '실물 도서 주문 현황 및 배송 상태 관리.',
    icon: '📦',
  },
  {
    href: '/admin/anthropic-usage',
    title: 'Anthropic API 사용 현황',
    desc: 'Q&A AI 답변 토큰 사용량 및 모델별 추정 비용.',
    icon: '🤖',
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest text-cc-muted uppercase mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-cc-text">관리자 대시보드</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MENU_CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="block no-underline">
            <div className="cc-glass p-6 rounded-xl hover:border-cc-accent/30 transition-colors border border-white/10 h-full">
              <div className="text-2xl mb-3">{card.icon}</div>
              <p className="text-base font-bold text-cc-text mb-1">{card.title}</p>
              <p className="text-sm text-cc-muted leading-relaxed">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
