"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { useSaveClient } from "@/api/clients";
import { getErrorMessage } from "@/lib/api";
import { applyServerErrors } from "@/lib/form-errors";
import type { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/page-parts";

const schema = z.object({
  first_name: z.string().trim().max(255),
  last_name: z.string().trim().max(255),
  phone: z.string().trim().min(1, "Inserisci il telefono").max(255),
  notes: z.string(),
});
type Values = z.infer<typeof schema>;

/** Crea o modifica una cliente. onDone riceve la cliente salvata. */
export function ClientForm({
  client,
  onDone,
  onDelete,
}: {
  client: Client | null;
  onDone: (saved: Client) => void;
  onDelete?: () => void;
}) {
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
      const saved = await save.mutateAsync({
        id: client?.id,
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        phone: values.phone,
        notes: values.notes || null,
      });
      toast.success(client ? "Cliente aggiornata" : "Cliente creata");
      onDone(saved);
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  });

  return (
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
  );
}
