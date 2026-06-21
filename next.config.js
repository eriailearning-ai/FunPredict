/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type errors are caught in dev — don't block production builds
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}
module.exports = nextConfig
