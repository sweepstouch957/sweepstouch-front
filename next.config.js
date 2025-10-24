/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  transpilePackages: ['@mui/x-charts'],

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

module.exports = config;
