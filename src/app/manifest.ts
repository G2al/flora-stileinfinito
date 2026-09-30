import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flora Stile Infinito",
    short_name: "Flora",
    description: "Gestione appuntamenti, clienti e servizi di Flora Stile Infinito.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "it",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
