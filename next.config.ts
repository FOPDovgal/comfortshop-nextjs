import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 301 redirects from old WordPress URLs
  async redirects() {
    return [
      {
        source: "/ru/blog/meteostantsii-dlya-doma",
        destination: "/oglyady/meteostatsiyi-dlya-domu",
        permanent: true,
      },
      {
        source: "/ru/blog/meteostantsii-dlya-doma/",
        destination: "/oglyady/meteostatsiyi-dlya-domu",
        permanent: true,
      },
      {
        source: "/mashinka-dlya-samostiynoi-strijki",
        destination: "/oglyady/mashinka-dlya-strijki",
        permanent: true,
      },
      {
        source: "/mashinka-dlya-samostiynoi-strijki/",
        destination: "/oglyady/mashinka-dlya-strijki",
        permanent: true,
      },
      {
        source: "/top-usb-ustroistv-dlya-doma",
        destination: "/top/top-usb-pryladiv-dlya-domu",
        permanent: true,
      },
      {
        source: "/top-usb-ustroistv-dlya-doma/",
        destination: "/top/top-usb-pryladiv-dlya-domu",
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "comfortshop.com.ua",
      },
    ],
  },
};

export default nextConfig;
