import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/items/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-items',
        expiration: { maxAgeSeconds: 60 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = pwaConfig({
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.domecekujosefa.cz' },
    ],
  },
});

export default nextConfig;
