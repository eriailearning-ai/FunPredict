/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type errors are caught in dev — don't block production builds
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ws is a native Node.js module used by @neondatabase/serverless —
  // tell webpack not to try to bundle it (server-side only)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'ws']
    }
    return config
  },
}
module.exports = nextConfig
