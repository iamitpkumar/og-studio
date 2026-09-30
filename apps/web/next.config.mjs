/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.MOTION_BUILD_OUTPUT || '.next',
  devIndicators: false,
  transpilePackages: ["@ai-studio/schemas", "@ai-studio/timeline", "@ai-studio/db"],
};

export default nextConfig;
