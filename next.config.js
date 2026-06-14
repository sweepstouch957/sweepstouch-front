/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true' && process.env.NODE_ENV === 'production',
  openAnalyzer: false,
});

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://*.mapbox.com",
      "font-src 'self' data: https://api.mapbox.com",
      "connect-src 'self' http://localhost:* ws://localhost:* https://*.sweepstouch.com wss://*.sweepstouch.com https://api.mapbox.com https://events.mapbox.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob: https://kiosko.sweepstouch.com https://links.sweepstouch.com",
      "frame-src 'self' blob: https://kiosko.sweepstouch.com https://links.sweepstouch.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const config = {
  reactStrictMode: false,
  transpilePackages: ['@mui/x-charts'],

  // ✅ Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  async headers() {
    return [
      // Demo viewer pages — permissive CSP for AI-generated content (inline scripts/styles, CDN OK)
      {
        source: '/demo/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      // All other routes — strict CSP
      {
        source: '/((?!demo).*)',
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://api2.sweepstouch.com/api';
    return [
      { source: '/api/auth/:path*', destination: `${API}/auth/:path*` },
      { source: '/api/cashiers/:path*', destination: `${API}/cashiers/:path*` },
      { source: '/api/cashiers', destination: `${API}/cashiers` },
      { source: '/api/stores/:storeId/cashiers/:path*', destination: `${API}/stores/:storeId/cashiers/:path*` },
      { source: '/api/stores/:storeId/cashiers', destination: `${API}/stores/:storeId/cashiers` },
    ];
  },

  images: {
    // ✅ Optimized device sizes — removes unnecessary large breakpoints for admin panel
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // ✅ Image sizes for smaller UI elements (logos, avatars)
    imageSizes: [16, 32, 48, 64, 96, 128, 200, 256],
    // ✅ Longer cache TTL for store logos (they rarely change)
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // ✅ Prefer AVIF for better compression, fallback to WebP
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'asset.cloudinary.com',
      },
    ],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = withBundleAnalyzer(config);
