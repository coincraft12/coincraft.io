interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'basic' | 'associate' | 'expert' | 'success' | 'danger';
  className?: string;
}

const variants = {
  default: 'bg-white/10 text-cc-muted',
  basic: 'bg-emerald-500/20 text-emerald-400',
  associate: 'bg-blue-500/20 text-blue-400',
  expert: 'bg-purple-500/20 text-purple-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  danger: 'bg-red-500/20 text-red-400',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
