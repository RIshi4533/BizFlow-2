/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ❌ Removed the unsupported "serverExternalPackages"
  // experimental: {
  //   serverExternalPackages: ['@genkit-ai/googleai'],
  // },

  // ✅ This is safe to keep if your dev environment requires it
  allowedDevOrigins: [
    'https://3000-firebase-studio-1753107539769.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev'
  ],
};

export default nextConfig;
