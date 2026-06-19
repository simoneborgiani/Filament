import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Esiste un package-lock.json anche nella home dell'utente: pinniamo la root
  // del workspace a questa cartella così Turbopack non la inferisce male.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
