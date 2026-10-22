import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(),
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  async rewrites() {
    return [
      { source: "/master", destination: "/admin" },
      { source: "/master/:path*", destination: "/admin/:path*" },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

export default nextConfig;
