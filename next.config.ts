import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.lumacdn.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/workshops/resources",
        destination: "/resources",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
