"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildTrend, fmtInt, niceMax } from "@/lib/stats";
import type { StatsDay } from "@/types/stats";

const HEIGHT = 230;
const PAD = { l: 34, r: 12, t: 14, b: 28 };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export function TrendChart({ days }: { days: StatsDay[] }) {
  const { points, grouped } = useMemo(() => buildTrend(days), [days]);
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);

  const n = points.length;
  const maxValue = Math.max(0, ...points.map((p) => Math.max(p.appointments, p.cancelled)));
  const max = niceMax(maxValue);
  const ticks = max <= 5 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, max / 2, max];

  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = HEIGHT - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v: number) => PAD.t + plotH * (1 - v / max);

  const line = (pick: (i: number) => number) => points.map((_, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(pick(i))}`).join(" ");
  const appLine = line((i) => points[i].appointments);
  const cancLine = line((i) => points[i].cancelled);
  const area = n > 1 ? `${appLine} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";

  const hasCancelled = points.some((p) => p.cancelled > 0);
  const maxLabels = Math.max(2, Math.floor(plotW / 52));
  const step = Math.ceil(n / maxLabels);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.l;
    const idx = n <= 1 ? 0 : Math.round((px / plotW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, idx)));
  }

  const active = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover), 70), Math.max(70, width - 70)) : 0;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-primary" aria-hidden /> Appuntamenti
        </span>
        {hasCancelled ? (
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-destructive/70" aria-hidden /> Annullati
          </span>
        ) : null}
        {grouped ? <span className="ml-auto">Somma per settimana</span> : null}
      </div>

      <div ref={ref} className="relative" style={{ height: HEIGHT }}>
        {width > 0 ? (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`Andamento degli appuntamenti: ${n} ${grouped ? "settimane" : n === 1 ? "giorno" : "giorni"}, massimo ${fmtInt(maxValue)}`}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
            style={{ touchAction: "pan-y" }}
            className="block select-none"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
                <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
                  {fmtInt(t)}
                </text>
              </g>
            ))}

            {area ? <path d={area} style={{ fill: "var(--primary)", opacity: 0.12 }} /> : null}
            {hasCancelled && n > 1 ? (
              <path
                d={cancLine}
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeLinejoin="round"
                style={{ stroke: "var(--destructive)", opacity: 0.7 }}
              />
            ) : null}
            {n > 1 ? (
              <path d={appLine} fill="none" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" style={{ stroke: "var(--primary)" }} />
            ) : null}

            {(n <= 31 || hover !== null) &&
              points.map((p, i) =>
                n <= 31 || i === hover ? (
                  <circle
                    key={p.key}
                    cx={x(i)}
                    cy={y(p.appointments)}
                    r={i === hover ? 4.5 : n === 1 ? 5 : 2.5}
                    style={{ fill: "var(--card)", stroke: "var(--primary)", strokeWidth: 2 }}
                  />
                ) : null,
              )}

            {points.map((p, i) =>
              i % step === 0 ? (
                <text key={p.key} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {p.label}
                </text>
              ) : null,
            )}

            {hover !== null ? (
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} className="stroke-muted-foreground/50" strokeDasharray="3 3" />
            ) : null}
          </svg>
        ) : null}

        {active ? (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: tipLeft }}
          >
            <p className="font-medium first-letter:uppercase">{active.title}</p>
            <p className="tabular-nums">
              <span className="font-semibold text-primary">{fmtInt(active.appointments)}</span> appuntamenti
            </p>
            {active.cancelled > 0 ? (
              <p className="tabular-nums text-destructive">{fmtInt(active.cancelled)} annullati</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Stessi dati in forma testuale per gli screen reader */}
      <div className="sr-only">
      <table>
        <caption>Appuntamenti {grouped ? "per settimana" : "per giorno"}</caption>
        <thead>
          <tr>
            <th>Periodo</th>
            <th>Appuntamenti</th>
            <th>Annullati</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <td>{p.title}</td>
              <td>{p.appointments}</td>
              <td>{p.cancelled}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
