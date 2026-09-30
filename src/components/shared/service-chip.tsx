import { CheckIcon } from "lucide-react";
import { DEFAULT_SERVICE_COLOR } from "@/config/business";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";

/** Badge di sola lettura con il colore del servizio. */
export function ServiceBadge({ service, className }: { service: Pick<Service, "name" | "color">; className?: string }) {
  const color = service.color || DEFAULT_SERVICE_COLOR;
  return (
    <span
      className={cn("inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-medium", className)}
      style={{ borderColor: `${color}66`, backgroundColor: `${color}1f` }}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {service.name}
    </span>
  );
}

/** Chip selezionabile (multi-selezione) con colore e durata. */
export function ServiceChip({
  service,
  selected,
  onToggle,
}: {
  service: Service;
  selected: boolean;
  onToggle: () => void;
}) {
  const color = service.color || DEFAULT_SERVICE_COLOR;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
      style={{
        borderColor: selected ? color : undefined,
        backgroundColor: selected ? `${color}26` : undefined,
      }}
    >
      {selected ? (
        <CheckIcon className="size-4" style={{ color }} />
      ) : (
        <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      )}
      {service.name}
      <span className="text-xs font-normal opacity-70">{service.duration_minutes} min</span>
    </button>
  );
}
