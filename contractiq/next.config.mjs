/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Required for react-pdf / PDF.js worker
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
