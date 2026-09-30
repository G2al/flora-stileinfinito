"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, ScissorsIcon, Trash2Icon } from "lucide-react";
import { useDeleteService, useSaveService, useServices } from "@/api/services";
import { DEFAULT_SERVICE_COLOR } from "@/config/business";
import { getErrorMessage } from "@/lib/api";
import { applyServerErrors } from "@/lib/form-errors";
import type { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, Field, ListSkeleton, PageHeader } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

const schema = z.object({
  name: z.string().trim().min(1, "Inserisci il nome").max(255),
  duration_minutes: z
    .number({ error: "Inserisci la durata" })
    .int("Durata non valida")
    .min(5, "Minimo 5 minuti")
    .max(720, "Massimo 720 minuti"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colore non valido"),
});
type Values = z.infer<typeof schema>;

function ServiceForm({ service, onDone }: { service: Service | null; onDone: () => void }) {
  const save = useSaveService();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? "",
      duration_minutes: service?.duration_minutes ?? 30,
      color: service?.color ?? DEFAULT_SERVICE_COLOR,
    },
  });
  const color = useWatch({ control, name: "color" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: service?.id, ...values });
      toast.success(service ? "Servizio aggiornato" : "Servizio creato");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Nome" htmlFor="service-name" error={errors.name?.message}>
        <Input id="service-name" autoFocus autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label="Durata (minuti)" htmlFor="service-duration" error={errors.duration_minutes?.message}>
        <Input
          id="service-duration"
          type="number"
          inputMode="numeric"
          min={5}
          max={720}
          step={5}
          aria-invalid={!!errors.duration_minutes}
          {...register("duration_minutes", { valueAsNumber: true })}
        />
      </Field>
      <Field label="Colore" htmlFor="service-color" error={errors.color?.message}>
        <div className="flex items-center gap-3">
          <input
            id="service-color"
            type="color"
            aria-label="Scegli il colore"
            className="h-11 w-16 cursor-pointer rounded-lg border border-input bg-transparent p-1"
            {...register("color")}
          />
          <span className="font-mono text-sm text-muted-foreground uppercase">{color}</span>
        </div>
      </Field>
      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending ? "Salvataggio…" : "Salva"}
      </Button>
    </form>
  );
}

export default function ServicesPage() {
  const { data, isLoading, isError, refetch } = useServices();
  const del = useDeleteService();
  const [editing, setEditing] = useState<Service | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  function openForm(s: Service | null) {
    setEditing(s);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Servizio eliminato");
      setToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossibile eliminare il servizio."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Servizi"
        description="Trattamenti e durate"
        actions={
          <Button onClick={() => openForm(null)}>
            <PlusIcon /> Nuovo
          </Button>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={ScissorsIcon}
          title="Nessun servizio"
          description="Crea i servizi offerti dal centro per poterli assegnare agli appuntamenti."
          action={<Button onClick={() => openForm(null)}>Aggiungi servizio</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data?.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span
                className="size-4 shrink-0 rounded-full ring-2 ring-background"
                style={{ backgroundColor: s.color || DEFAULT_SERVICE_COLOR }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.duration_minutes} min</p>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Modifica ${s.name}`} onClick={() => openForm(s)}>
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Elimina ${s.name}`}
                className="text-destructive"
                onClick={() => setToDelete(s)}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Modifica servizio" : "Nuovo servizio"}
        className="sm:max-w-sm"
      >
        {formOpen ? <ServiceForm key={editing?.id ?? "new"} service={editing} onDone={() => setFormOpen(false)} /> : null}
      </ResponsiveDialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminare il servizio?"
        description={toDelete ? `“${toDelete.name}” verrà eliminato.` : undefined}
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
