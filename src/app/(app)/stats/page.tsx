"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  BanIcon,
  CalendarClockIcon,
  CalendarRangeIcon,
  ChartColumnIcon,
  ClockIcon,
  Loader2Icon,
  TimerIcon,
  UsersIcon,
  CalendarCheck2Icon,
} from "lucide-react";
import { useStats } from "@/api/stats";
import { getFieldErrors } from "@/lib/api";
import {
  DEFAULT_PRESET,
  buildInsights,
  fmtDuration,
  fmtHours,
  fmtInt,
  fmtNum,
  fmtPercent,
  isPreset,
  periodLabel,
  presetRange,
  validateRange,
  type Preset,
} from "@/lib/stats";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared/page-parts";
import { ServiceBars, StaffBars } from "@/components/stats/bar-list";
import { ClientsSummary, TopClients } from "@/components/stats/clients-widgets";
import { HourChart, WeekdayChart } from "@/components/stats/column-charts";
import { Insights } from "@/components/stats/insights";
import { KpiCard, KpiSkeleton } from "@/components/stats/kpi-card";
import { PeriodPicker } from "@/components/stats/period-picker";
import { StatusDonut } from "@/components/stats/status-donut";
import { TrendChart } from "@/components/stats/trend-chart";
import { Widget } from "@/components/stats/widget";

export default function StatsPage() {
  // useSearchParams richiede Suspense nel build statico.
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsContent />
    </Suspense>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Caricamento">
      {Array.from({ length: 7 }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}

function StatsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const presetParam = params.get("preset");
  const fromParam = params.get("from");
  const toParam = params.get("to");

  const preset: Preset = isPreset(presetParam) ? presetParam : fromParam && toParam ? "custom" : DEFAULT_PRESET;

  // Se nell'URL ci sono from/to valgono quelli (link condivisibile); altrimenti si calcola dal preset.
  const { from, to } = useMemo(() => {
    if (fromParam !== null && toParam !== null) return { from: fromParam, to: toParam };
    if (preset === "custom") return { from: "", to: "" };
    return presetRange(preset);
  }, [preset, fromParam, toParam]);

  const rangeError = validateRange(from, to);
  const { data, isLoading, isError, isFetching, isPlaceholderData, error, refetch } = useStats(from, to, !rangeError);

  // Valori più recenti dell'intervallo: router.replace aggiorna l'URL in modo asincrono,
  // quindi due modifiche ravvicinate (es. inizio e fine) non devono usare valori vecchi.
  const latest = useRef({ from, to });
  useEffect(() => {
    latest.current = { from, to };
  }, [from, to]);

  function setUrl(nextPreset: Preset, nextFrom: string, nextTo: string) {
    latest.current = { from: nextFrom, to: nextTo };
    const q = new URLSearchParams({ preset: nextPreset, from: nextFrom, to: nextTo });
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }

  function onPreset(next: Preset) {
    if (next === "custom") setUrl("custom", from || presetRange("month").from, to || presetRange("month").to);
    else {
      const r = presetRange(next);
      setUrl(next, r.from, r.to);
    }
  }

  // 422 dal backend: messaggio sotto il selettore. Altri errori: banner con "Riprova".
  const is422 = axios.isAxiosError(error) && error.response?.status === 422;
  const fieldErrors = is422 ? getFieldErrors(error) : {};
  const serverMessage = is422
    ? (fieldErrors.to ?? fieldErrors.from ?? (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Periodo non valido.")
    : null;
  const pickerError = rangeError ?? serverMessage;

  const insights = useMemo(() => (data ? buildInsights(data) : []), [data]);
  const showData = !!data && !rangeError && !is422;
  const refreshing = isFetching && isPlaceholderData;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Statistiche" description="Come sta andando il centro" />

      <PeriodPicker
        preset={preset}
        from={from}
        to={to}
        error={pickerError}
        onPreset={onPreset}
        onCustom={(c) => setUrl("custom", c.from ?? latest.current.from, c.to ?? latest.current.to)}
      />

      {showData ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm">
          <CalendarRangeIcon className="size-4 text-muted-foreground" aria-hidden />
          <strong>{periodLabel(data.period.from, data.period.to)}</strong>
          <span className="text-muted-foreground">
            · rispetto al {periodLabel(data.period.previous_from, data.period.previous_to)}
          </span>
          {refreshing ? <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" aria-label="Aggiornamento" /> : null}
        </p>
      ) : null}

      <div className="mt-4">
        {rangeError || is422 ? null : isError && !data ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <StatsSkeleton />
        ) : (
          <div className={refreshing ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {isError ? <ErrorState onRetry={() => refetch()} /> : null}

            {data.totals.appointments === 0 ? (
              <div className="flex flex-col gap-3">
                <EmptyState
                  icon={ChartColumnIcon}
                  title="Nessun appuntamento in questo periodo"
                  description="Prova a scegliere un altro periodo, per esempio “Ultimi 30 giorni” o “Quest'anno”."
                />
                {data.to_schedule > 0 ? (
                  <KpiCard
                    label="Da programmare"
                    value={fmtInt(data.to_schedule)}
                    icon={CalendarClockIcon}
                    tone="warning"
                    href="/appointments?status=pending"
                    sub="In attesa di una data"
                  />
                ) : null}
              </div>
            ) : (
              <StatsBody data={data} insights={insights} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsBody({ data, insights }: { data: NonNullable<ReturnType<typeof useStats>["data"]>; insights: string[] }) {
  const { totals, comparison, clients } = data;
  const highCancel = totals.cancellation_rate > 15;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Appuntamenti"
          value={fmtInt(totals.active)}
          icon={CalendarCheck2Icon}
          change={comparison.active_change_percent}
          sub="Confermati e completati"
        />
        <KpiCard label="Ore prenotate" value={fmtHours(totals.booked_hours)} icon={ClockIcon} />
        <KpiCard label="Media al giorno" value={fmtNum(totals.avg_per_day)} icon={CalendarRangeIcon} sub="appuntamenti" />
        <KpiCard label="Durata media" value={fmtDuration(totals.avg_duration_minutes)} icon={TimerIcon} />
        <KpiCard
          label="Annullamenti"
          value={fmtPercent(totals.cancellation_rate)}
          icon={BanIcon}
          tone={highCancel ? "danger" : "default"}
          sub={`${fmtInt(totals.by_status.cancelled)} su ${fmtInt(totals.appointments)} appuntamenti${highCancel ? " · valore alto" : ""}`}
        />
        <KpiCard
          label="Clienti serviti"
          value={fmtInt(clients.served)}
          icon={UsersIcon}
          sub={`di cui ${fmtInt(clients.returning)} che tornano · ${fmtInt(clients.new)} nuovi`}
        />
        <KpiCard
          label="Da programmare"
          value={fmtInt(data.to_schedule)}
          icon={CalendarClockIcon}
          tone="warning"
          href="/appointments?status=pending"
          sub="In attesa di una data"
        />
      </div>

      <Insights items={insights} />

      <Widget title="Andamento nel tempo" description="Appuntamenti per giorno">
        <TrendChart days={data.per_day} />
      </Widget>

      <div className="grid gap-4 lg:grid-cols-2">
        <Widget title="Per operatrice" description="Appuntamenti e ore lavorate">
          <StaffBars staff={data.by_staff} />
        </Widget>
        <Widget title="Servizi più richiesti" description="Quante volte e per quanto tempo">
          <ServiceBars services={data.by_service} />
        </Widget>
        <Widget title="Giorni della settimana">
          <WeekdayChart data={data.by_weekday} />
        </Widget>
        <Widget title="Fasce orarie" description="Ora di inizio degli appuntamenti">
          <HourChart data={data.by_hour} />
        </Widget>
        <Widget title="Stato degli appuntamenti" className="lg:col-span-2">
          <StatusDonut byStatus={totals.by_status} />
        </Widget>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Widget title="Clienti più assidue" description="Più appuntamenti nel periodo">
          <TopClients top={clients.top} />
        </Widget>
        <Widget title="Clienti">
          <ClientsSummary clients={clients} />
        </Widget>
      </div>
    </div>
  );
}

