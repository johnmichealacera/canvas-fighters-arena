/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads-static/:path*" }];
  },
};

export default nextConfig;
