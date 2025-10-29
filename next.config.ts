import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // REQUIRED FOR CAPACITOR: Export as static site
  output: 'export',

  images: {
    // Static export requires unoptimized images
    unoptimized: true,
    // Prefer modern formats for better compression where supported
    formats: ["image/avif", "image/webp"],
    // Allow images from any domain for product descriptions
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // Faster placeholder to avoid layout shift without heavy blur
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://us-assets.i.posthog.com https://us.i.posthog.com;
              connect-src 'self' http://localhost:3001 https://connect.facebook.net https://www.facebook.com https://us-assets.i.posthog.com https://us.i.posthog.com https://res.cloudinary.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' blob: data: https: http:;
              media-src 'self' https://res.cloudinary.com;
              style-src 'self' 'unsafe-inline';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
          // Cache third-party resources more aggressively
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Specific caching for static assets
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache images and media longer
      {
        source: "/(.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif|mp4|webm|ogg|mp3))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy API requests to admin backend (for development cross-origin workaround)
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_ADMIN_API_URL
          ? `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/:path*`
          : "http://localhost:3001/api/:path*",
      },
      // PostHog analytics
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
