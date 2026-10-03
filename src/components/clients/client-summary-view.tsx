"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  BanIcon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  CalendarRangeIcon,
  EuroIcon,
  Loader2Icon,
  ReceiptIcon,
  WalletIcon,
} from "lucide-react";
import { useClientSummary } from "@/api/clients";
import { CLIENT_PRESETS, clientRange, type ClientPreset } from "@/lib/client-period";
import { getFieldErrors } from "@/lib/api";
import { formatDate, formatDateTimeShort } from "@/lib/dates";
import { fmtEuro } from "@/lib/money";
import { fmtInt, fromDay } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";
import { AppointmentFormDialog } from "@/components/appointments/appointment-form";
import { Input } from "@/components/ui/input";
import { AppointmentTotal } from "@/components/shared/appointment-total";
import { EmptyState, ErrorState, FieldError } from "@/components/shared/page-parts";
import { ServiceBadge } from "@/components/shared/service-chip";
import { StatusBadge } from "@/components/shared/status-badge";
import { KpiCard, KpiSkeleton } from "@/components/stats/kpi-card";
import { Widget, WidgetEmpty } from "@/components/stats/widget";

/** Ultimi 12 mesi: colonne con l'importo speso. */
function MonthBars({ data }: { data: { month: string; appointments: number; spent: number }[] }) {
  const max = Math.max(0, ...data.map((m) => m.spent));
  const HEIGHT = 120;
  if (max === 0) return <WidgetEmpty>Nessuna spesa negli ultimi 12 mesi.</WidgetEmpty>;
  const top = data.find((m) => m.spent === max);

  return (
    <ul className="flex items-end gap-0.5 sm:gap-1.5" style={{ height: HEIGHT + 34 }} aria-label="Speso per mese">
      {data.map((m) => {
        const date = parseISO(`${m.month}-01`);
        const h = Math.round((m.spent / max) * HEIGHT);
        const isTop = top?.month === m.month;
        return (
          <li
            key={m.month}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            aria-label={`${format(date, "MMMM yyyy", { locale: it })}: ${fmtEuro(m.spent)}, ${m.appointments} ${m.appointments === 1 ? "appuntamento" : "appuntamenti"}`}
            title={`${format(date, "MMMM yyyy", { locale: it })}: ${fmtEuro(m.spent)} (${m.appointments} app.)`}
          >
            <span className={cn("text-[9px] tabular-nums sm:text-[10px]", isTop ? "font-bold text-primary" : "text-muted-foreground")}>
              {m.spent > 0 ? Math.round(m.spent) : ""}
            </span>
            <span
              className={cn("w-full max-w-8 rounded-t-md", isTop ? "bg-primary" : "bg-primary/35")}
              style={{ height: Math.max(h, m.spent > 0 ? 3 : 1) }}
              aria-hidden
            />
            <span className="text-[10px] text-muted-foreground capitalize sm:text-[11px]">{format(date, "MMM", { locale: it })}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ClientSummaryView({ clientId }: { clientId: number }) {
  const [preset, setPreset] = useState<ClientPreset>("month");
  const [custom, setCustom] = useState(() => clientRange("month"));
  const [editing, setEditing] = useState<Appointment | null>(null);

  const range = useMemo(() => (preset === "custom" ? custom : clientRange(preset)), [preset, custom]);
  const customError = preset === "custom" && range.from && range.to && range.to < range.from ? "La data di fine non può precedere quella di inizio." : null;
  const valid = !customError && !!range.from && !!range.to;

  const { data, isLoading, isError, isFetching, isPlaceholderData, error, refetch } = useClientSummary(clientId, range, valid);

  const is422 = axios.isAxiosError(error) && error.response?.status === 422;
  const serverMessage = is422 ? (Object.values(getFieldErrors(error))[0] ?? "Periodo non valido.") : null;
  const pickerError = customError ?? serverMessage;
  const refreshing = isFetching && isPlaceholderData;

  const maxServiceSpent = Math.max(1, ...(data?.by_service.map((s) => s.spent) ?? [0]));
  const unpriced = data ? Math.max(data.period_totals.unpriced_appointments, 0) : 0;
  const lifetimeUnpriced = data?.lifetime.unpriced_appointments ?? 0;

  return (
    <section aria-label="Riepilogo" className="mt-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Riepilogo</h2>
        {refreshing ? <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-label="Aggiornamento" /> : null}
      </div>

      <div className="flex flex-col gap-3">
        <div
          role="group"
          aria-label="Periodo"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          {CLIENT_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={preset === p.value}
              onClick={() => setPreset(p.value)}
              className={cn(
                "flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors md:h-9",
                preset === p.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === "custom" ? (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:max-w-md">
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
              Dal
              <Input
                type="date"
                value={custom.from}
                max={custom.to || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                aria-invalid={!!pickerError}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
              Al
              <Input
                type="date"
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                aria-invalid={!!pickerError}
              />
            </label>
          </div>
        ) : null}
        <FieldError message={pickerError ?? undefined} />

        {data && valid ? (
          <p className="text-sm text-muted-foreground">
            {preset === "all"
              ? "Tutta la storia"
              : range.from === range.to
                ? formatDate(fromDay(range.from))
                : `${formatDate(fromDay(range.from))} – ${formatDate(fromDay(range.to))}`}
          </p>
        ) : null}
      </div>

      {!valid || is422 ? null : isError && !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className={cn("flex flex-col gap-4 transition-opacity", refreshing && "opacity-60")}>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Speso nel periodo" value={fmtEuro(data.period_totals.spent)} icon={EuroIcon} tone="success" />
            <KpiCard
              label="Appuntamenti svolti"
              value={fmtInt(data.period_totals.realized)}
              icon={CalendarCheck2Icon}
              sub={`su ${fmtInt(data.period_totals.appointments)} nel periodo`}
            />
            <KpiCard label="Scontrino medio" value={fmtEuro(data.period_totals.avg_ticket)} icon={ReceiptIcon} />
            <KpiCard
              label="In programma"
              value={fmtInt(data.period_totals.upcoming)}
              icon={CalendarClockIcon}
              tone="warning"
              sub={`valore ${fmtEuro(data.period_totals.upcoming_value)}`}
            />
            <KpiCard label="Annullati" value={fmtInt(data.period_totals.cancelled)} icon={BanIcon} tone={data.period_totals.cancelled > 0 ? "danger" : "default"} />
            <KpiCard
              label="Speso in totale"
              value={fmtEuro(data.lifetime.spent)}
              icon={WalletIcon}
              sub={`${fmtInt(data.lifetime.realized)} appuntamenti svolti in tutto`}
            />
            <KpiCard
              label="Prima visita"
              value={data.lifetime.first_visit ? formatDate(data.lifetime.first_visit) : "—"}
              icon={CalendarRangeIcon}
            />
            <KpiCard
              label="Ultima visita"
              value={data.lifetime.last_visit ? formatDate(data.lifetime.last_visit) : "—"}
              icon={CalendarRangeIcon}
            />
          </div>

          {unpriced > 0 || lifetimeUnpriced > 0 ? (
            <p className="text-xs text-muted-foreground">
              Alcuni servizi non hanno prezzo
              {unpriced > 0 ? ` (${unpriced} ${unpriced === 1 ? "appuntamento" : "appuntamenti"} nel periodo)` : ""}: gli importi
              mostrati sono quindi per difetto.
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Widget title="Ultimi 12 mesi" description="Speso per mese (€)">
              <MonthBars data={data.by_month} />
            </Widget>

            <Widget title="Servizi ricevuti" description="Svolti nel periodo">
              {data.by_service.length === 0 ? (
                <WidgetEmpty>Nessun servizio svolto nel periodo.</WidgetEmpty>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.by_service.map((s) => (
                    <li key={s.service_id}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{s.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {fmtInt(s.count)} × · {fmtEuro(s.spent)}
                        </span>
                      </div>
                      <div
                        className="h-2.5 overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`${s.name}: ${s.count} volte, ${fmtEuro(s.spent)}`}
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: s.spent > 0 ? `${Math.max(2, (s.spent / maxServiceSpent) * 100)}%` : "2%", opacity: s.spent > 0 ? 1 : 0.35 }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Widget>
          </div>

          <Widget title="Appuntamenti del periodo" description={`${data.appointments.length} ${data.appointments.length === 1 ? "appuntamento" : "appuntamenti"}`}>
            {data.appointments.length === 0 ? (
              <EmptyState title="Nessun appuntamento in questo periodo" description="Prova a scegliere un altro periodo." />
            ) : (
              <ul className="flex flex-col gap-2">
                {data.appointments.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...a, client: data.client })}
                      className="flex w-full flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{a.scheduled_at ? formatDateTimeShort(a.scheduled_at) : "Da programmare"}</span>
                        <StatusBadge status={a.status} />
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {a.services?.map((s) => <ServiceBadge key={s.id} service={s} />)}
                      </span>
                      <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>{a.staff?.name ?? "—"}</span>
                        <AppointmentTotal appointment={a} showWarningText />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Widget>
        </div>
      )}

      <AppointmentFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} appointment={editing} />
    </section>
  );
}
