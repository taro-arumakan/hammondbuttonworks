import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SVG mockups live in /public and are served directly; no remote image hosts
  // are needed for the pilot. Add `images.remotePatterns` here once photoreal
  // hero images are hosted on a CDN.
  reactStrictMode: true,
  // The product JSON is read from disk at runtime by the gated /api/price route.
  // Trace it into that serverless function so it ships on Vercel.
  outputFileTracingIncludes: {
    "/api/price": ["./content/products/**"],
  },
};

export default nextConfig;
