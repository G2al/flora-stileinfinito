"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon, UserRoundIcon } from "lucide-react";
import { useDeleteStaff, useSaveStaff, useStaff } from "@/api/staff";
import { getErrorMessage } from "@/lib/api";
import { applyServerErrors } from "@/lib/form-errors";
import type { Staff } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, Field, ListSkeleton, PageHeader } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

const schema = z.object({ name: z.string().trim().min(1, "Inserisci il nome").max(255) });
type Values = z.infer<typeof schema>;

function StaffForm({ staff, onDone }: { staff: Staff | null; onDone: () => void }) {
  const save = useSaveStaff();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: staff?.name ?? "" } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: staff?.id, name: values.name });
      toast.success(staff ? "Operatrice aggiornata" : "Operatrice creata");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Nome" htmlFor="staff-name" error={errors.name?.message}>
        <Input id="staff-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending ? "Salvataggio…" : "Salva"}
      </Button>
    </form>
  );
}

export default function StaffPage() {
  const { data, isLoading, isError, refetch } = useStaff();
  const del = useDeleteStaff();
  const [editing, setEditing] = useState<Staff | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Staff | null>(null);

  function openForm(s: Staff | null) {
    setEditing(s);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Operatrice eliminata");
      setToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossibile eliminare l'operatrice."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Staff"
        description="Le operatrici del centro"
        actions={
          <Button onClick={() => openForm(null)}>
            <PlusIcon /> Nuova
          </Button>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={UserRoundIcon}
          title="Nessuna operatrice"
          description="Aggiungi la prima operatrice per poter creare appuntamenti."
          action={<Button onClick={() => openForm(null)}>Aggiungi operatrice</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data?.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {s.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
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
        title={editing ? "Modifica operatrice" : "Nuova operatrice"}
        className="sm:max-w-sm"
      >
        {formOpen ? <StaffForm key={editing?.id ?? "new"} staff={editing} onDone={() => setFormOpen(false)} /> : null}
      </ResponsiveDialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminare l'operatrice?"
        description={toDelete ? `“${toDelete.name}” verrà eliminata. Potrebbero essere eliminati anche i suoi appuntamenti.` : undefined}
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
