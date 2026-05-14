/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const config = {
  reactStrictMode: false,
  transpilePackages: ['@mui/x-charts'],

  // ✅ Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
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
