import { formatTime } from "@/lib/dates";
import { clientFullName } from "@/lib/format";
import type { Appointment } from "@/types";
import { WhatsAppBadge } from "@/components/shared/whatsapp-badge";
import { apptColor } from "@/components/calendar/calendar-utils";

/** Riga di appuntamento per liste (agenda e dettaglio giorno del mese). */
export function AppointmentRow({ appointment: a, onClick }: { appointment: Appointment; onClick: () => void }) {
  const services = a.services?.map((s) => s.name).join(" + ");
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-stretch gap-3 rounded-xl border bg-card p-2.5 text-left transition-colors hover:bg-muted/50"
    >
      <span className="w-1.5 shrink-0 rounded-full" style={{ backgroundColor: apptColor(a) }} aria-hidden />
      <span className="flex w-[4.25rem] shrink-0 flex-col justify-center text-sm tabular-nums">
        <span className="font-semibold">{formatTime(a.scheduled_at)}</span>
        <span className="text-xs text-muted-foreground">{formatTime(a.ends_at)}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{clientFullName(a.client)}</span>
        <span className="block truncate text-sm text-muted-foreground">{services || "Nessun servizio"}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1 self-start">
        {a.staff ? (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {a.staff.name}
          </span>
        ) : null}
        <WhatsAppBadge sent={a.whatsapp_sent} compact />
      </span>
    </button>
  );
}
