import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    APP_URL: process.env.APP_URL,
  },
};

export default nextConfig;
