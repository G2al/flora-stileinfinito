"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { fetchWhatsAppUrl, openExternal, useUpdateAppointment } from "@/api/appointments";
import { getErrorMessage } from "@/lib/api";
import { fromDateTimeLocalValue, nowDateTimeLocal, toIso } from "@/lib/dates";
import { applyServerErrors } from "@/lib/form-errors";
import { clientFullName } from "@/lib/format";
import type { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

const schema = z.object({
  scheduledAt: z
    .string()
    .min(1, "Seleziona data e ora")
    .refine((v) => {
      const d = fromDateTimeLocalValue(v);
      return !!d && d.getTime() >= Date.now() - 60_000;
    }, "La data non può essere nel passato"),
  sendWhatsApp: z.boolean(),
});
type Values = z.infer<typeof schema>;

function ScheduleForm({ appointment, onDone }: { appointment: Appointment; onDone: () => void }) {
  const update = useUpdateAppointment();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { scheduledAt: "", sendWhatsApp: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    const date = fromDateTimeLocalValue(values.scheduledAt)!;
    try {
      await update.mutateAsync({ id: appointment.id, scheduled_at: toIso(date) });
    } catch (error) {
      if (!applyServerErrors(error, setError, { scheduled_at: "scheduledAt" })) toast.error(getErrorMessage(error));
      return;
    }
    toast.success("Appuntamento programmato");
    if (values.sendWhatsApp) {
      try {
        openExternal(await fetchWhatsAppUrl(appointment.id, "confirmation"));
      } catch (error) {
        toast.error(getErrorMessage(error, "Non riesco a preparare il messaggio WhatsApp."));
      }
    }
    onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {clientFullName(appointment.client)}
        {appointment.staff ? ` · ${appointment.staff.name}` : ""}
      </p>
      <Field label="Data e ora *" htmlFor="sched-date" error={errors.scheduledAt?.message}>
        <Input
          id="sched-date"
          type="datetime-local"
          step={900}
          min={nowDateTimeLocal()}
          aria-invalid={!!errors.scheduledAt}
          {...register("scheduledAt")}
        />
      </Field>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="size-5 accent-[var(--primary)]" {...register("sendWhatsApp")} />
        Invia conferma WhatsApp
      </label>
      <Button type="submit" size="lg" disabled={update.isPending}>
        {update.isPending ? "Salvataggio…" : "Programma"}
      </Button>
    </form>
  );
}

export function ScheduleDialog({
  appointment,
  onOpenChange,
}: {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveDialog
      open={!!appointment}
      onOpenChange={onOpenChange}
      title="Programma appuntamento"
      className="sm:max-w-sm"
    >
      {appointment ? <ScheduleForm key={appointment.id} appointment={appointment} onDone={() => onOpenChange(false)} /> : null}
    </ResponsiveDialog>
  );
}
