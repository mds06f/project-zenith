/**
 * File: next.config.mjs
 * Purpose: Next.js 15 (App Router) configuration for Project Zenith.
 *
 * Notes:
 *  - CESIUM_BASE_URL is defined so Cesium can locate its static Workers/Assets/
 *    Widgets that the postinstall script copies into /public/cesium.
 *  - We mark `cesium` as transpiled because it ships ESM that Next must process.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['cesium'],
  env: {
    // Served from /public/cesium — see scripts/copy-cesium-assets.mjs
    CESIUM_BASE_URL: '/cesium',
  },
  webpack: (config) => {
    // Cesium expects this global to resolve its worker + asset URLs at runtime.
    config.plugins = config.plugins || [];
    return config;
  },
};

export default nextConfig;
