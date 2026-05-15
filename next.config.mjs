/** @type {import('next').NextConfig} */
const nextConfig = {
  // Speed optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Faster builds
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
