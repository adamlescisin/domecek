'use client';

import { useEffect } from 'react';

export default function ChunkErrorRecovery() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      if (
        event.message?.includes('ChunkLoadError') ||
        event.message?.includes('Loading chunk') ||
        event.error?.name === 'ChunkLoadError'
      ) {
        // Reload once to pick up the new deployment; avoid reload loops
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
