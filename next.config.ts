import type { NextConfig } from "next";

// Derive the basePath from NEXT_PUBLIC_APP_URL at build time.
// e.g. NEXT_PUBLIC_APP_URL=https://appluxe.com/blog  →  basePath = '/blog'
// e.g. NEXT_PUBLIC_APP_URL=http://localhost:3000      →  basePath = ''  (no sub-path)
function deriveBasePath(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  try {
    const { pathname } = new URL(appUrl);
    // Strip trailing slash; if root ("/") return empty string
    const p = pathname.replace(/\/$/, '');
    return p === '' ? '' : p;
  } catch {
    return '';
  }
}

const basePath = deriveBasePath();

const nextConfig: NextConfig = {
  basePath,
  experimental: {
    middlewareClientMaxBodySize: '100mb',
    proxyClientMaxBodySize: '100mb',
  }
};

export default nextConfig;
