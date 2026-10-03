import { AlertCircleIcon } from "lucide-react";
import { fmtEuro } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

/** Totale dell'appuntamento (prezzi applicati) con avviso discreto se alcuni servizi non hanno prezzo. */
export function AppointmentTotal({
  appointment: a,
  className,
  showWarningText,
}: {
  appointment: Pick<Appointment, "services" | "total_price" | "unpriced_services">;
  className?: string;
  /** Mostra il testo "alcuni servizi senza prezzo" (altrimenti solo l'icona con tooltip) */
  showWarningText?: boolean;
}) {
  if (!a.services || a.services.length === 0) return null;
  const unpriced = a.unpriced_services ?? 0;
  const total = a.total_price ?? 0;
  const allUnpriced = unpriced === a.services.length;

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm tabular-nums", className)}>
      <strong className={allUnpriced ? "font-normal text-muted-foreground" : "font-semibold"}>
        {allUnpriced ? "—" : fmtEuro(total)}
      </strong>
      {unpriced > 0 ? (
        <span
          title="Alcuni servizi senza prezzo"
          className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400"
        >
          <AlertCircleIcon className="size-3.5" aria-hidden />
          {showWarningText ? "alcuni servizi senza prezzo" : <span className="sr-only">alcuni servizi senza prezzo</span>}
        </span>
      ) : null}
    </span>
  );
}
