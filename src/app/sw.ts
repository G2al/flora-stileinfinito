/// <reference lib="webworker" />
import { NetworkOnly, Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // Asset statici (JS/CSS/font/immagini di /public) in precache.
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Le API (altra origine, es. Laravel) non vanno MAI in cache: i dati devono essere sempre freschi.
      matcher: ({ url }) => url.origin !== self.location.origin || url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      // Le pagine si caricano sempre dalla rete; se manca la connessione scatta il fallback /offline.
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
