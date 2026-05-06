'use client';

import { useEffect } from 'react';

function isStaleAssetError(msg?: string, name?: string): boolean {
  return (
    name === 'ChunkLoadError' ||
    !!msg?.includes('ChunkLoadError') ||
    !!msg?.includes('Loading chunk') ||
    !!msg?.includes('Failed to fetch dynamically imported module') ||
    !!msg?.includes('error loading dynamically imported module')
  );
}

function forceReload() {
  const retries = parseInt(sessionStorage.getItem('chunk_reload') || '0', 10);
  if (retries >= 2) return;
  sessionStorage.setItem('chunk_reload', String(retries + 1));
  const url = new URL(window.location.href);
  url.searchParams.set('_bust', Date.now().toString());
  window.location.replace(url.toString());
}

export default function ChunkErrorRecovery() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      if (isStaleAssetError(event.message, event.error?.name)) forceReload();
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const msg = event.reason?.message ?? String(event.reason ?? '');
      const name = event.reason?.name;
      if (isStaleAssetError(msg, name)) forceReload();
    }

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
