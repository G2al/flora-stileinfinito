import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon, MinusIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtSigned } from "@/lib/stats";
import { Skeleton } from "@/components/shared/page-parts";

type Tone = "default" | "warning" | "danger" | "success";

const TONES: Record<Tone, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/15 text-red-600 dark:text-red-400",
  success: "bg-green-500/15 text-green-600 dark:text-green-400",
};

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Riga di dettaglio sotto il valore */
  sub?: React.ReactNode;
  /** Variazione %: numero = confronto, null = nessun dato precedente, undefined = non mostrare */
  change?: number | null;
  tone?: Tone;
  href?: string;
}

function Change({ value }: { value: number | null }) {
  if (value === null) {
    return <p className="text-xs text-muted-foreground">Nessun dato nel periodo precedente</p>;
  }
  const up = value > 0;
  const down = value < 0;
  const Icon = up ? ArrowUpIcon : down ? ArrowDownIcon : MinusIcon;
  return (
    <p className="flex flex-wrap items-center gap-x-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          up && "text-green-600 dark:text-green-400",
          down && "text-red-600 dark:text-red-400",
          !up && !down && "text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {fmtSigned(value)}
        <span className="sr-only">{up ? " in aumento" : down ? " in calo" : " invariato"}</span>
      </span>
      <span className="text-muted-foreground">vs periodo precedente</span>
    </p>
  );
}

export function KpiCard({ label, value, icon: Icon, sub, change, tone = "default", href }: Props) {
  const body = (
    <>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl leading-tight font-semibold tabular-nums">{value}</p>
        {change !== undefined ? <Change value={change} /> : null}
        {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
      </div>
      {href ? <ChevronRightIcon className="size-4 shrink-0 self-center text-muted-foreground" aria-hidden /> : null}
    </>
  );

  const cls = "flex items-start gap-3 rounded-xl border bg-card p-3.5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:bg-muted/50")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
      <Skeleton className="size-10" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}
