import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO_URL = 'https://www.domecekujosefa.cz/wp-content/uploads/2021/10/DUJ_logo_black_2.png';

interface LogoProps {
  variant?: 'black' | 'white';
  height?: number;
  className?: string;
}

export default function Logo({ variant = 'black', height = 40, className }: LogoProps) {
  return (
    <Image
      src={LOGO_URL}
      alt="Domeček u Josefa"
      height={height}
      width={height * 3}
      className={cn('object-contain', variant === 'white' ? 'invert' : '', className)}
      priority
    />
  );
}
