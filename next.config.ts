import { NextConfig } from "next";

export const config: NextConfig = {
  runtime: 'experimental-edge',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/refresh-token',
        destination: 'http://localhost:3001/api/refresh-token',
      },
    ]
  },
};