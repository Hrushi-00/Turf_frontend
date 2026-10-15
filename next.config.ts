import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.vecteezy.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  env: {
    APP_URL: process.env.APP_URL,
  },
};

export default nextConfig;
