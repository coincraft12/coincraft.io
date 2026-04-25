import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
  },
  images: {
    imageSizes: [32, 48, 64, 96, 128, 160, 220, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.coincraft.io',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
