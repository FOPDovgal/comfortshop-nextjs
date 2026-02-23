/** @type {import('next').NextConfig} */
const nextConfig = {
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

      // Category slug renames
      {
        source: "/kategoriyi/kuhnya",
        destination: "/kategoriyi/kuhonni-gadzhety",
        permanent: true,
      },
      {
        source: "/kategoriyi/kuhnya/",
        destination: "/kategoriyi/kuhonni-gadzhety",
        permanent: true,
      },
      {
        source: "/kategoriyi/kuhnya/:subslug*",
        destination: "/kategoriyi/kuhonni-gadzhety/:subslug*",
        permanent: true,
      },
      {
        source: "/kategoriyi/usb-gadzhety",
        destination: "/kategoriyi/suchasni-gadzhety",
        permanent: true,
      },
      {
        source: "/kategoriyi/usb-gadzhety/",
        destination: "/kategoriyi/suchasni-gadzhety",
        permanent: true,
      },
      {
        source: "/kategoriyi/usb-gadzhety/:subslug*",
        destination: "/kategoriyi/suchasni-gadzhety/:subslug*",
        permanent: true,
      },
      {
        source: "/kategoriyi/turyzm",
        destination: "/kategoriyi/sport-ta-turyzm",
        permanent: true,
      },
      {
        source: "/kategoriyi/turyzm/",
        destination: "/kategoriyi/sport-ta-turyzm",
        permanent: true,
      },
      {
        source: "/kategoriyi/turyzm/:subslug*",
        destination: "/kategoriyi/sport-ta-turyzm/:subslug*",
        permanent: true,
      },
      {
        source: "/kategoriyi/zdorovya",
        destination: "/kategoriyi/zdorovya-ta-komfort",
        permanent: true,
      },
      {
        source: "/kategoriyi/zdorovya/",
        destination: "/kategoriyi/zdorovya-ta-komfort",
        permanent: true,
      },
      {
        source: "/kategoriyi/zdorovya/:subslug*",
        destination: "/kategoriyi/zdorovya-ta-komfort/:subslug*",
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

module.exports = nextConfig;
