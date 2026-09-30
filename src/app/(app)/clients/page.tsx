"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useAppointments } from "@/api/appointments";
import { useClients, useDeleteClient, useSaveClient } from "@/api/clients";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api";
import { formatDateTimeShort } from "@/lib/dates";
import { clientFullName } from "@/lib/format";
import { applyServerErrors } from "@/lib/form-errors";
import type { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, Field, ListSkeleton, PageHeader, Skeleton } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { ServiceBadge } from "@/components/shared/service-chip";
import { StatusBadge } from "@/components/shared/status-badge";

const schema = z.object({
  first_name: z.string().trim().max(255),
  last_name: z.string().trim().max(255),
  phone: z.string().trim().min(1, "Inserisci il telefono").max(255),
  notes: z.string(),
});
type Values = z.infer<typeof schema>;

function ClientHistory({ clientId }: { clientId: number }) {
  const { data, isLoading, isError } = useAppointments({ client_id: clientId, include_undated: true });

  return (
    <section className="mt-6 border-t pt-4">
      <h3 className="mb-2 text-sm font-semibold">Storico appuntamenti</h3>
      {isLoading ? (
        <Skeleton className="h-16" />
      ) : isError ? (
        <p className="text-sm text-destructive">Impossibile caricare lo storico.</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun appuntamento per questa cliente.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {[...data]
            .sort((a, b) => (b.scheduled_at ?? "9").localeCompare(a.scheduled_at ?? "9"))
            .map((a) => (
              <li key={a.id} className="rounded-lg border p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{a.scheduled_at ? formatDateTimeShort(a.scheduled_at) : "Da programmare"}</span>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {a.staff ? <span className="text-muted-foreground">{a.staff.name}</span> : null}
                  {a.services?.map((s) => <ServiceBadge key={s.id} service={s} />)}
                </div>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

function ClientForm({ client, onDone, onDelete }: { client: Client | null; onDone: () => void; onDelete?: () => void }) {
  const save = useSaveClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: client?.first_name ?? "",
      last_name: client?.last_name ?? "",
      phone: client?.phone ?? "",
      notes: client?.notes ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        id: client?.id,
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        phone: values.phone,
        notes: values.notes || null,
      });
      toast.success(client ? "Cliente aggiornata" : "Cliente creata");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  });

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" htmlFor="c-first" error={errors.first_name?.message}>
            <Input id="c-first" autoComplete="off" {...register("first_name")} />
          </Field>
          <Field label="Cognome" htmlFor="c-last" error={errors.last_name?.message}>
            <Input id="c-last" autoComplete="off" {...register("last_name")} />
          </Field>
        </div>
        <Field label="Telefono *" htmlFor="c-phone" error={errors.phone?.message}>
          <Input
            id="c-phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>
        <Field label="Note" htmlFor="c-notes" error={errors.notes?.message}>
          <Textarea id="c-notes" rows={3} {...register("notes")} />
        </Field>
        <div className="flex gap-2">
          {onDelete ? (
            <Button type="button" variant="destructive" size="lg" onClick={onDelete} aria-label="Elimina cliente">
              <Trash2Icon />
            </Button>
          ) : null}
          <Button type="submit" size="lg" className="flex-1" disabled={save.isPending}>
            {save.isPending ? "Salvataggio…" : "Salva"}
          </Button>
        </div>
      </form>
      {client ? <ClientHistory clientId={client.id} /> : null}
    </>
  );
}

export default function ClientsPage() {
  // useSearchParams richiede Suspense nel build statico.
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ClientsContent />
    </Suspense>
  );
}

function ClientsContent() {
  const [search, setSearch] = useState(useSearchParams().get("q") ?? "");
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search.trim(), 300);
  const { data, isLoading, isError, isFetching, refetch } = useClients({ q, page, per_page: 20 });
  const del = useDeleteClient();

  const [editing, setEditing] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Client | null>(null);

  function openForm(c: Client | null) {
    setEditing(c);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Cliente eliminata");
      setToDelete(null);
      setFormOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossibile eliminare la cliente."));
    }
  }

  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Clienti"
        description={meta ? `${meta.total} ${meta.total === 1 ? "cliente" : "clienti"}` : undefined}
        actions={
          <Button onClick={() => openForm(null)}>
            <PlusIcon /> Nuova
          </Button>
        }
      />

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cerca per nome, cognome o telefono"
          aria-label="Cerca clienti"
          className="pl-9"
          type="search"
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={q ? "Nessun risultato" : "Nessuna cliente"}
          description={q ? "Prova con un altro nome o numero." : "Aggiungi la prima cliente."}
          action={!q ? <Button onClick={() => openForm(null)}>Aggiungi cliente</Button> : undefined}
        />
      ) : (
        <>
          <ul className={`flex flex-col gap-2 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            {data?.data.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openForm(c)}
                  className="flex min-h-16 w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {(c.last_name || c.first_name || c.phone).charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{clientFullName(c)}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <PhoneIcon className="size-3" />
                      {c.phone}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>

          {meta && meta.last_page > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeftIcon /> Precedente
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {meta.current_page} di {meta.last_page}
              </span>
              <Button variant="outline" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Successiva <ChevronRightIcon />
              </Button>
            </div>
          ) : null}
        </>
      )}

      <ResponsiveDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? clientFullName(editing) : "Nuova cliente"}
      >
        {formOpen ? (
          <ClientForm
            key={editing?.id ?? "new"}
            client={editing}
            onDone={() => setFormOpen(false)}
            onDelete={editing ? () => setToDelete(editing) : undefined}
          />
        ) : null}
      </ResponsiveDialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminare la cliente?"
        description={
          toDelete ? `${clientFullName(toDelete)} verrà eliminata insieme a tutti i suoi appuntamenti. L'azione non si può annullare.` : undefined
        }
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
