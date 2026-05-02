import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BasketProvider } from '@/lib/basket-context';

export const metadata: Metadata = {
  title: 'Domeček u Josefa — Obchod',
  description: 'Objednejte si služby Domečku u Josefa',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DuJ Shop',
  },
};

export const viewport: Viewport = {
  themeColor: '#1C1C1A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="antialiased">
        <BasketProvider>{children}</BasketProvider>
      </body>
    </html>
  );
}
