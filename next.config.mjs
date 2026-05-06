/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.domecekujosefa.cz' },
    ],
  },
  async headers() {
    return [
      {
        // HTML pages must never be served from cache — stale HTML references
        // old chunk hashes that no longer exist after a new deployment.
        source: '/((?!_next/static|_next/image).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
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
};

export default nextConfig;
