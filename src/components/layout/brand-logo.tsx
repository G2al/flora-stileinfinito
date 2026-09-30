import Image from "next/image";
import { cn } from "@/lib/utils";

/** Due versioni del logo: rosso per il tema chiaro, bianco per il tema scuro (scelte via CSS, senza flash). */
export function BrandLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <Image
        src="/brand/logo-for-mode-white.png"
        alt="Flora Stile Infinito"
        width={442}
        height={338}
        priority={priority}
        className="h-full w-auto object-contain dark:hidden"
      />
      <Image
        src="/brand/logo-for-mode-dark.png"
        alt="Flora Stile Infinito"
        width={1672}
        height={941}
        priority={priority}
        className="hidden h-full w-auto object-contain dark:block"
      />
    </span>
  );
}
