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
  async redirects() {
    return [
      { source: "/teacher", destination: "/instructor", permanent: true },
      { source: "/teacher/studio", destination: "/instructor/courses", permanent: true },
      { source: "/teacher/studio/new", destination: "/instructor/courses/new", permanent: true },
      { source: "/teacher/studio/:id", destination: "/instructor/courses/:id", permanent: true },
      { source: "/teacher/:path*", destination: "/instructor/:path*", permanent: true },
      { source: "/dashboard/profile", destination: "/dashboard/settings", permanent: false },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
