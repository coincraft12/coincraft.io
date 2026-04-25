'use client';

export default function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>;
}
