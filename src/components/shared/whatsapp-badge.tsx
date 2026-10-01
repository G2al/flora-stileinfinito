import { CheckCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Messaggio accettato da WhatsApp (non "consegnato" né "letto"). Se non inviato non mostriamo nulla. */
export function WhatsAppBadge({ sent, className, compact }: { sent: boolean; className?: string; compact?: boolean }) {
  if (!sent) return null;
  return (
    <span
      title="Conferma WhatsApp inviata"
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full bg-green-100 px-2 text-xs font-medium whitespace-nowrap text-green-800 dark:bg-green-400/20 dark:text-green-300",
        className,
      )}
    >
      <CheckCheckIcon className="size-3.5" aria-hidden />
      {compact ? <span className="sr-only">WhatsApp inviato</span> : "WhatsApp inviato"}
    </span>
  );
}
