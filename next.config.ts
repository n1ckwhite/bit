import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Performance optimizations */
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  
  /* Compiler optimizations */
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  /* Modern browser support - ES2020+ */
  output: 'standalone',
  
  /* Bundle optimization */
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Modern browser support - reduce polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Remove polyfills for modern features
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
        fs: false,
        path: false,
        os: false,
      };
      
      // Exclude polyfills from bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'date-fns': 'date-fns',
        // Exclude polyfills
        'core-js': false,
        'regenerator-runtime': false,
      };
      
      // Bundle splitting for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          recharts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'recharts',
            chunks: 'all',
            priority: 20,
          },
          heroicons: {
            test: /[\\/]node_modules[\\/]@heroicons[\\/]/,
            name: 'heroicons',
            chunks: 'all',
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            priority: 5,
          },
        },
      };
      
      // Optimize module resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        'date-fns': 'date-fns',
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
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60'
          },
        ],
      },
    ];
  },
};

export default nextConfig;