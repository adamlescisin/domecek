import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BasketProvider } from '@/lib/basket-context';
import ChunkErrorRecovery from '@/components/ChunkErrorRecovery';

export const metadata: Metadata = {
  title: 'Domeček u Josefa — Obchod',
  description: 'Objednejte si služby Domečku u Josefa',
  manifest: '/manifest.json',
  appleWebApp: {
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
        {/* Silently unregister any old service workers left from PWA-enabled
            deployments. Does NOT reload — ChunkErrorRecovery handles reloads
            if a stale chunk is actually requested. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            if(!('serviceWorker' in navigator)) return;
            navigator.serviceWorker.getRegistrations().then(function(regs){
              regs.forEach(function(r){ r.unregister(); });
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
