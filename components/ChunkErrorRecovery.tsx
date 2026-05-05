'use client';

import { useEffect } from 'react';

export default function ChunkErrorRecovery() {
  useEffect(() => {
    // Unregister any previously installed service worker — it caused
    // ChunkLoadErrors after new deployments by serving stale HTML.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
    }

    // Auto-reload once if a ChunkLoadError slips through during the transition
    function handleError(event: ErrorEvent) {
      if (
        event.message?.includes('ChunkLoadError') ||
        event.message?.includes('Loading chunk') ||
        event.error?.name === 'ChunkLoadError'
      ) {
        if (!sessionStorage.getItem('chunk_reload')) {
          sessionStorage.setItem('chunk_reload', '1');
          window.location.reload();
        }
      }
    }
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}
