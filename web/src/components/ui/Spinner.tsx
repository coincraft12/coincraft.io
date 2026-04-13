interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block border-2 border-cc-accent border-t-transparent rounded-full animate-spin ${sizes[size]} ${className}`}
      aria-label="로딩 중"
    />
  );
}
