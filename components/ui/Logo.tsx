import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'black' | 'white';
  height?: number;
  className?: string;
}

export default function Logo({ variant = 'black', height = 40, className }: LogoProps) {
  return (
    <Image
      src={variant === 'white' ? '/logo-white.png' : '/logo-black.png'}
      alt="Domeček u Josefa"
      height={height}
      width={height * 3}
      className={cn('object-contain', className)}
      priority
    />
  );
}
