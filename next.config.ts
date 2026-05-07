/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable ESLint during build for deployment
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Remove swcMinify as it's deprecated
  images: {
    // Replace domains with remotePatterns
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      // Add Vercel deployment URL pattern
      {
        protocol: 'https',
        hostname: 'hygieia-ai.vercel.app',
        port: '',
        pathname: '/**',
      },
      // Allow all subdomains from vercel.app
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Add unoptimized flag for GIF images
    unoptimized: true,
  },
  // Add trailing slash to ensure consistent routing
  trailingSlash: true,
  // Ensure output is standalone for better compatibility
  output: 'standalone',
};

export default nextConfig;
