import Link from "next/link";
import { PhoneIcon } from "lucide-react";
import { fmtInt } from "@/lib/stats";
import type { StatsClients } from "@/types/stats";
import { WidgetEmpty } from "@/components/stats/widget";

export function TopClients({ top }: { top: StatsClients["top"] }) {
  if (top.length === 0) return <WidgetEmpty>Nessuna cliente nel periodo.</WidgetEmpty>;
  return (
    <ol className="flex flex-col divide-y">
      {top.map((c, i) => (
        <li key={c.client_id}>
          <Link
            href={`/clients?q=${encodeURIComponent(c.phone)}`}
            className="flex min-h-14 items-center gap-3 py-2 transition-colors hover:bg-muted/40"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{c.name}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <PhoneIcon className="size-3" aria-hidden /> {c.phone}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-lg leading-none font-semibold tabular-nums">{fmtInt(c.appointments)}</span>
              <span className="text-[11px] text-muted-foreground">app.</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function ClientsSummary({ clients }: { clients: StatsClients }) {
  const firstTime = Math.max(0, clients.served - clients.returning);
  const returningPct = clients.served > 0 ? (clients.returning / clients.served) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-muted/50 p-2.5">
          <dd className="text-xl font-semibold tabular-nums">{fmtInt(clients.total)}</dd>
          <dt className="text-[11px] text-muted-foreground">in anagrafica</dt>
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5">
          <dd className="text-xl font-semibold tabular-nums">{fmtInt(clients.new)}</dd>
          <dt className="text-[11px] text-muted-foreground">nuove nel periodo</dt>
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5">
          <dd className="text-xl font-semibold tabular-nums">{fmtInt(clients.served)}</dd>
          <dt className="text-[11px] text-muted-foreground">servite</dt>
        </div>
      </dl>

      {clients.served > 0 ? (
        <div>
          <p className="mb-1.5 text-sm font-medium">Tra le clienti servite</p>
          <div
            className="flex h-3 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${clients.returning} già clienti, ${firstTime} alla prima visita`}
          >
            <div className="bg-primary" style={{ width: `${returningPct}%` }} />
            <div className="bg-primary/30" style={{ width: `${100 - returningPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden />
              <strong className="tabular-nums">{fmtInt(clients.returning)}</strong>
              <span className="text-muted-foreground">già clienti (tornano)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary/30" aria-hidden />
              <strong className="tabular-nums">{fmtInt(firstTime)}</strong>
              <span className="text-muted-foreground">nuove</span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
