/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['pdf-parse'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
