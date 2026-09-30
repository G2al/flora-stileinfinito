"use client";

import { cn } from "@/lib/utils";
import { MAX_RANGE_DAYS, PRESETS, toDay, type Preset } from "@/lib/stats";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/shared/page-parts";

interface Props {
  preset: Preset;
  from: string;
  to: string;
  error?: string | null;
  onPreset: (preset: Preset) => void;
  onCustom: (change: { from?: string; to?: string }) => void;
}

export function PeriodPicker({ preset, from, to, error, onPreset, onCustom }: Props) {
  const today = toDay(new Date());

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Periodo"
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      >
        {PRESETS.map((p) => {
          const active = preset === p.value;
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={active}
              onClick={() => onPreset(p.value)}
              className={cn(
                "flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors md:h-9",
                active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {preset === "custom" ? (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Dal
            <Input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => onCustom({ from: e.target.value })}
              aria-invalid={!!error}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Al
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => onCustom({ to: e.target.value })}
              aria-invalid={!!error}
            />
          </label>
          <p className="col-span-2 -mt-1 text-xs text-muted-foreground">Massimo {MAX_RANGE_DAYS} giorni.</p>
        </div>
      ) : null}

      <FieldError message={error ?? undefined} />
    </div>
  );
}
