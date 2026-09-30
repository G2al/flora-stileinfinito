import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/types";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  completed: "Completato",
  cancelled: "Annullato",
};

const STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-400/20 dark:text-red-300",
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
