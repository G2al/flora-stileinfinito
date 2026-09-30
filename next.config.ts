import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { randomUUID } from "node:crypto";

const revision = randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Il service worker è attivo solo nei build di produzione.
  disable: process.env.NODE_ENV === "development",
  // Pagina offline + file di /public realmente usati dall'app (elenco esplicito:
  // evita di mettere in precache i sorgenti pesanti del logo).
  additionalPrecacheEntries: [
    "/offline",
    "/brand/logo.png",
    "/app-icons/icon-192.png",
    "/app-icons/icon-512.png",
    "/app-icons/icon-maskable-512.png",
    "/app-icons/apple-touch-icon.png",
  ].map((url) => ({ url, revision })),
});

const nextConfig: NextConfig = {
  // Serwist usa webpack per generare il service worker (build con `next build --webpack`).
  turbopack: {},
  // Permette di aprire il dev server da altri dispositivi della rete locale (es. iPhone).
  allowedDevOrigins: ["192.168.1.16"],
};

export default withSerwist(nextConfig);
