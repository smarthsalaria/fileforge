import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '';
let basePath = '';

if (isGithubActions) {
  const repoEnv = process.env.GITHUB_REPOSITORY || "";
  const repo = repoEnv.replace(/.*?\//, '');
  assetPrefix = `/${repo}/`;
  basePath = `/${repo}`;
}

const nextConfig: NextConfig = {
  // 1. Tell Next.js to digest these specific packages
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  
  // Enforces static export for GitHub Pages (Disables Server Actions)
  output: 'export',

  images: {
    unoptimized: true, // GitHub Pages does not support Next Image Optimization
  },

  basePath: basePath,
  assetPrefix: assetPrefix,

  trailingSlash: true,

  // 2. Standard Webpack fix for PDF libraries
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  
  // 3. Disable strict mode if the error persists (optional, but helps with PDF workers)
  reactStrictMode: false, 
};

export default nextConfig;