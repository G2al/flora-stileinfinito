"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ClipboardListIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useAppointments, useDeleteAppointment } from "@/api/appointments";
import { useStaff } from "@/api/staff";
import { getErrorMessage } from "@/lib/api";
import { formatRelativeDateTime } from "@/lib/dates";
import { clientFullName } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/types";
import { AppointmentFormDialog } from "@/components/appointments/appointment-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/shared/page-parts";
import { ServiceBadge } from "@/components/shared/service-chip";
import { STATUS_LABELS, StatusBadge } from "@/components/shared/status-badge";
import { WhatsAppBadge } from "@/components/shared/whatsapp-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

type Sort = "date_desc" | "date_asc" | "client";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function matches(a: Appointment, terms: string[]) {
  if (terms.length === 0) return true;
  const hay = normalize(
    [a.client?.first_name, a.client?.last_name, a.client?.phone].filter(Boolean).join(" "),
  );
  return terms.every((t) => hay.includes(t));
}

function sortAppointments(list: Appointment[], sort: Sort) {
  const copy = [...list];
  if (sort === "client") {
    return copy.sort((a, b) => clientFullName(a.client).localeCompare(clientFullName(b.client), "it"));
  }
  const dir = sort === "date_asc" ? 1 : -1;
  return copy.sort((a, b) => {
    // Senza data sempre in cima, come fa il gestionale.
    if (!a.scheduled_at && !b.scheduled_at) return 0;
    if (!a.scheduled_at) return -1;
    if (!b.scheduled_at) return 1;
    return a.scheduled_at.localeCompare(b.scheduled_at) * dir;
  });
}

const STATUS_VALUES: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export default function AppointmentsPage() {
  // useSearchParams richiede Suspense nel build statico.
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <AppointmentsContent />
    </Suspense>
  );
}

function AppointmentsContent() {
  const initialStatus = useSearchParams().get("status");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "">(
    STATUS_VALUES.includes(initialStatus as AppointmentStatus) ? (initialStatus as AppointmentStatus) : "",
  );
  const [staffId, setStaffId] = useState("");
  const [sort, setSort] = useState<Sort>("date_desc");

  const staffQuery = useStaff();
  const { data, isLoading, isError, refetch } = useAppointments({
    include_undated: true,
    status: status || undefined,
    staff_id: staffId ? Number(staffId) : undefined,
  });
  const del = useDeleteAppointment();

  const [form, setForm] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null });
  const [toDelete, setToDelete] = useState<Appointment | null>(null);

  const rows = useMemo(() => {
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    return sortAppointments((data ?? []).filter((a) => matches(a, terms)), sort);
  }, [data, search, sort]);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Appuntamento eliminato");
      setToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossibile eliminare l'appuntamento."));
    }
  }

  const filtered = !!(search || status || staffId);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Appuntamenti"
        description={data ? `${rows.length} ${rows.length === 1 ? "appuntamento" : "appuntamenti"}` : undefined}
        actions={
          <Button onClick={() => setForm({ open: true, appointment: null })}>
            <PlusIcon /> Nuovo
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-[1fr_12rem_12rem_12rem]">
        <div className="relative col-span-2 md:col-span-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per cliente o telefono"
            aria-label="Cerca appuntamenti per cliente"
            className="pl-9"
          />
        </div>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus | "")} aria-label="Filtra per stato">
          <option value="">Tutti gli stati</option>
          {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={staffId} onChange={(e) => setStaffId(e.target.value)} aria-label="Filtra per operatrice">
          <option value="">Tutte le operatrici</option>
          {staffQuery.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordina per" className="col-span-2 md:col-span-1">
          <option value="date_desc">Data: più recenti</option>
          <option value="date_asc">Data: meno recenti</option>
          <option value="client">Cliente A–Z</option>
        </NativeSelect>
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title={filtered ? "Nessun risultato" : "Nessun appuntamento"}
          description={filtered ? "Prova a cambiare i filtri." : "Crea il primo appuntamento."}
          action={
            !filtered ? <Button onClick={() => setForm({ open: true, appointment: null })}>Nuovo appuntamento</Button> : undefined
          }
        />
      ) : (
        <>
          {/* Mobile: card */}
          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map((a) => (
              <li key={a.id}>
                <div className="rounded-xl border bg-card">
                  <button
                    type="button"
                    onClick={() => setForm({ open: true, appointment: a })}
                    className="block w-full p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{clientFullName(a.client)}</p>
                        <p className="text-sm text-muted-foreground">{a.staff?.name ?? "—"}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={a.status} />
                        <WhatsAppBadge sent={a.whatsapp_sent} />
                      </div>
                    </div>
                    <p className={`mt-1.5 text-sm font-medium ${a.scheduled_at ? "" : "text-amber-600 dark:text-amber-400"}`}>
                      {formatRelativeDateTime(a.scheduled_at)}
                    </p>
                    {a.services && a.services.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.services.map((s) => (
                          <ServiceBadge key={s.id} service={s} />
                        ))}
                      </div>
                    ) : null}
                  </button>
                </div>
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
                  <th className="px-4 py-2.5 font-medium">Servizi</th>
                  <th className="px-4 py-2.5 font-medium">Data / Ora</th>
                  <th className="px-4 py-2.5 font-medium">Stato</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    tabIndex={0}
                    onClick={() => setForm({ open: true, appointment: a })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setForm({ open: true, appointment: a });
                    }}
                    className="cursor-pointer hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none"
                  >
                    <td className="px-4 py-3 font-medium">{clientFullName(a.client)}</td>
                    <td className="px-4 py-3">{a.staff?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.services?.length ? a.services.map((s) => <ServiceBadge key={s.id} service={s} />) : "—"}
                      </div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${a.scheduled_at ? "" : "text-amber-600 dark:text-amber-400"}`}>
                      {formatRelativeDateTime(a.scheduled_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={a.status} />
                        <WhatsAppBadge sent={a.whatsapp_sent} compact />
                      </div>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        aria-label={`Elimina appuntamento di ${clientFullName(a.client)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setToDelete(a);
                        }}
                      >
                        <Trash2Icon />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AppointmentFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        appointment={form.appointment}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminare l'appuntamento?"
        description={toDelete ? `Appuntamento di ${clientFullName(toDelete.client)}. L'azione non si può annullare.` : undefined}
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
