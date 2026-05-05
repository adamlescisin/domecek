import withPWA from 'next-pwa';

// SW disabled — avoids stale-chunk ChunkLoadErrors after new deployments.
// The manifest.json keeps Add-to-Home-Screen working without a SW.
const pwaConfig = withPWA({
  dest: 'public',
  disable: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = pwaConfig({
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.domecekujosefa.cz' },
    ],
  },
  async headers() {
    return [
      {
        // HTML pages must never be served from cache after a new deployment —
        // stale HTML references old chunk hashes that no longer exist on the server.
        // Exclude _next/static (immutable, content-hashed) and _next/image.
        source: '/((?!_next/static|_next/image).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        destination: 'https://stripe.com/apple-pay/association-file',
      },
    ];
  },
});

export default nextConfig;
