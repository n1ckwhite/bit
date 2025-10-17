import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Performance optimizations */
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'recharts', 
      'date-fns',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled'
    ],
  },
  
  /* Modern browser support */
  swcMinify: true,
  
  /* Output configuration for modern browsers */
  output: 'standalone',
  
  /* Compiler optimizations */
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },
  
  /* Bundle optimization */
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Enhanced tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // More aggressive bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        cacheGroups: {
          // Core React libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 40,
          },
          // Chart libraries
          charts: {
            test: /[\\/]node_modules[\\/](recharts|lightweight-charts)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 30,
          },
          // UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](@heroicons|@mui)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 25,
          },
          // Date utilities
          date: {
            test: /[\\/]node_modules[\\/]date-fns[\\/]/,
            name: 'date',
            chunks: 'all',
            priority: 20,
          },
          // Other vendors
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Common chunks
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            priority: 5,
          },
        },
      };
    }
    return config;
  },
  
  images: {
    domains: ["assets.coingecko.com"],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  /* Headers for performance */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
    ];
  },
};

export default nextConfig;