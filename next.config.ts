import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable the Image Optimization API to avoid INVALID_IMAGE_OPTIMIZE_REQUEST on Vercel
    // All images will be served directly instead of through /_next/image
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "connect.facebook.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.facebook.com",
        port: "",
        pathname: "/**",
      },
    ],
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
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://us-assets.i.posthog.com https://us.i.posthog.com;
              connect-src 'self' https://connect.facebook.net https://www.facebook.com https://us-assets.i.posthog.com https://us.i.posthog.com;
              img-src 'self' blob: data: https://www.facebook.com https://*.unsplash.com https://*.cloudinary.com;
              style-src 'self' 'unsafe-inline';
              font-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
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
