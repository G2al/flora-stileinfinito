"use client";

import { CalendarClockIcon, CalendarPlusIcon } from "lucide-react";
import { useToSchedule } from "@/api/appointments";
import { formatDateTimeShort } from "@/lib/dates";
import { clientFullName } from "@/lib/format";
import type { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/page-parts";

interface Props {
  onSchedule: (a: Appointment) => void;
  onEdit: (a: Appointment) => void;
  /** Dentro un pannello: senza titolo e margine. */
  embedded?: boolean;
}

export function ToScheduleList({ onSchedule, onEdit, embedded }: Props) {
  const { data, isLoading, isError, refetch } = useToSchedule();

  return (
    <section aria-labelledby="to-schedule-title" className={embedded ? "" : "mt-8"}>
      <div className={embedded ? "sr-only" : "mb-3 flex items-center gap-2"}>
        <h2 id="to-schedule-title" className="text-lg font-semibold">
          Appuntamenti da programmare
        </h2>
        {data && data.length > 0 ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            {data.length}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={CalendarClockIcon} title="Nessun appuntamento da programmare" description="Tutto in ordine!" />
      ) : (
        <>
          {/* Mobile: card */}
          <ul className="flex flex-col gap-2 md:hidden">
            {data.map((a) => (
              <li key={a.id} className="rounded-xl border bg-card p-3">
                <button type="button" onClick={() => onEdit(a)} className="block w-full text-left">
                  <p className="font-medium">{clientFullName(a.client)}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.staff?.name ?? "—"} · creato il {formatDateTimeShort(a.created_at)}
                  </p>
                  {a.notes ? <p className="mt-1 line-clamp-2 text-sm">{a.notes}</p> : null}
                </button>
                <Button className="mt-3 w-full" onClick={() => onSchedule(a)}>
                  <CalendarPlusIcon /> Programma
                </Button>
              </li>
            ))}
          </ul>

          {/* Desktop: tabella */}
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Staff</th>
                  <th className="px-4 py-2.5 font-medium">Note</th>
                  <th className="px-4 py-2.5 font-medium">Creato il</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <button type="button" className="font-medium hover:underline" onClick={() => onEdit(a)}>
                        {clientFullName(a.client)}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">{a.staff?.name ?? "—"}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-muted-foreground">{a.notes || "—"}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{formatDateTimeShort(a.created_at)}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" onClick={() => onSchedule(a)}>
                        <CalendarPlusIcon /> Programma
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
