import type { NextConfig } from 'next';

// Static export: `next build` writes plain HTML/CSS/JS to out/, which
// server/index.js serves next to the /media volume. No Node rendering at runtime.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
