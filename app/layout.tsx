import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BasketProvider } from '@/lib/basket-context';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';

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
      <head>
        {/* Runs before any JS chunks load. If an old service worker is found,
            unregister it and reload once so the browser fetches fresh HTML. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            if(!('serviceWorker' in navigator)) return;
            navigator.serviceWorker.getRegistrations().then(function(regs){
              if(!regs.length) return;
              Promise.all(regs.map(function(r){ return r.unregister(); })).then(function(){
                location.reload();
              });
            });
          })();
        `}} />
      </head>
      <body className="antialiased">
        <ChunkErrorRecovery />
        <BasketProvider>{children}</BasketProvider>
      </body>
    </html>
  );
}
