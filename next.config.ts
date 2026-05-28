import type { NextConfig } from 'next'

// NEXT_PUBLIC_BASE_PATH is injected by the GitHub Actions workflow as
// "/<repo-name>" so asset paths resolve correctly under github.io/<repo>.
// Leave it unset for local development.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: {
    // next/image optimisation endpoint isn't available in static exports
    unoptimized: true,
  },
}

export default nextConfig
