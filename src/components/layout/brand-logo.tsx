import Image from "next/image";
import { cn } from "@/lib/utils";

/** Il logo è rosso su trasparente: in dark mode lo appoggiamo su una piastra chiara per leggerlo bene. */
export function BrandLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl dark:bg-white/95 dark:px-2",
        className,
      )}
    >
      <Image
        src="/brand/logo.png"
        alt="Flora Stile Infinito"
        width={666}
        height={375}
        priority={priority}
        className="h-full w-auto object-contain"
      />
    </span>
  );
}
