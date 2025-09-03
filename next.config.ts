import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
  // Disable the Image Optimization API to avoid INVALID_IMAGE_OPTIMIZE_REQUEST on Vercel
  // All images will be served directly instead of through /_next/image
  unoptimized: true,
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
    ],
  },
};

export default nextConfig;
