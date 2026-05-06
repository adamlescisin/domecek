import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'inactive' | 'neutral';
  className?: string;
}

export default function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium',
        {
          'bg-sage/15 text-sage': variant === 'active',
          'bg-border text-charcoal/50': variant === 'inactive',
          'bg-sand/20 text-brown': variant === 'neutral',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
