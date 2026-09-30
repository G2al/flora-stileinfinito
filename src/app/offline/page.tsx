import type { Metadata } from "next";
import { WifiOffIcon } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <BrandLogo className="h-32" />
      <WifiOffIcon className="size-10 text-muted-foreground" aria-hidden />
      <p className="max-w-xs text-lg font-medium">Riconnettiti per continuare ad usare Flora Stile Infinito</p>
    </main>
  );
}
