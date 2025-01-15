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
};