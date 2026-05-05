'use client';

import { useEffect } from 'react';

export default function ChunkErrorRecovery() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
    }

    function handleError(event: ErrorEvent) {
      const isChunkError =
        event.message?.includes('ChunkLoadError') ||
        event.message?.includes('Loading chunk') ||
        event.error?.name === 'ChunkLoadError';

      if (!isChunkError) return;

      // Allow up to 2 auto-reload attempts per session to avoid infinite loops.
      const retries = parseInt(sessionStorage.getItem('chunk_reload') || '0', 10);
      if (retries >= 2) return;

      sessionStorage.setItem('chunk_reload', String(retries + 1));

      // Append a cache-buster query param so the browser requests fresh HTML
      // from the server instead of serving the stale cached version that
      // referenced the now-missing chunk files.
      const url = new URL(window.location.href);
      url.searchParams.set('_bust', Date.now().toString());
      window.location.replace(url.toString());
    }

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}
