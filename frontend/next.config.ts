import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/circle-proxy/:path*",
        destination: "https://api.circle.com/:path*",
      },
    ];
  },
};

export default config;
