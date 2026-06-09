/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // нужно для Docker multi-stage build
}

export default nextConfig
