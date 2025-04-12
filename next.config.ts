import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // Spread existing fallbacks
        fs: false, // Ignore fs module on client-side
        encoding: false, // Ignore encoding module on client-side
      };
    }

    return config;
  },
}

export default nextConfig
