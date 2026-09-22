import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    contentDispositionType: "inline",
  },
  async redirects() {
    return [
      { source: "/blog/5-serras-e-831-km-de-moto-em-um-fim-de", destination: "/blog/rastro-da-serpente-de-moto", permanent: true },
      { source: "/blog/de-r15-para-as-cataratas-roteiro-de", destination: "/blog/de-r15-nas-cataratas", permanent: true },
      { source: "/blog/de-r15-a-serra-do-rio-do-rastro-um-sonho-em", destination: "/blog/r15-na-serra-do-rio-do-rastro", permanent: true },
      { source: "/blog/como-limpar-e-lubrificar-a-corrente-da-moto-corretamente", destination: "/blog/como-limpar-a-corrente-da-moto-cuidados-e-lubrificacao", permanent: true },
      { source: "/blog/rota-513-letts-road-e-o-t-nel-de-bambus-um", destination: "/blog/r15-em-ponta-grossa", permanent: true },
      { source: "/blog/calibragem-de-pneus-de-moto-a-frio-o-guia-pr-tico", destination: "/blog/calibragem-de-pneus-de-moto-confira-a-pressao-a-frio", permanent: true },
      { source: "/blog/recorde-hist-rico-honda-emplaca-mais-de-1-milh-o-d", destination: "/blog/honda-supera-1-milh-o-de-motos-emplacadas-em-oito-", permanent: true },
      { source: "/blog/galeria-de-fotos-royal-enfield-flying-flea-c6-ganh", destination: "/blog/royal-enfield-flying-flea-c6-ganha-nova-cor-branca", permanent: true },
      { source: "/blog/royal-enfield-flying-flea-c6-ganha-nova-cor-motoci", destination: "/blog/royal-enfield-flying-flea-c6-ganha-nova-cor-branca", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
