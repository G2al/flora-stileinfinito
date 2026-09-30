"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BellIcon, MessageCircleIcon, PlusIcon, Trash2Icon, UserPlusIcon, XIcon } from "lucide-react";
import {
  fetchWhatsAppUrl,
  openExternal,
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
  type AppointmentInput,
} from "@/api/appointments";
import { useSaveClient } from "@/api/clients";
import { useServices } from "@/api/services";
import { useSaveStaff, useStaff } from "@/api/staff";
import { DEFAULT_APPOINTMENT_MINUTES } from "@/config/business";
import { fromDateTimeLocalValue, formatDuration, formatTime, toDateTimeLocalValue, toIso, addMinutes, nowDateTimeLocal } from "@/lib/dates";
import { getErrorMessage } from "@/lib/api";
import { applyServerErrors } from "@/lib/form-errors";
import type { Appointment, AppointmentStatus, Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ClientPicker } from "@/components/appointments/client-picker";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field, ListSkeleton } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { ServiceChip } from "@/components/shared/service-chip";
import { STATUS_LABELS } from "@/components/shared/status-badge";

const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled"];

function buildSchema(initialScheduledAt: string) {
  return z
    .object({
      clientMode: z.enum(["existing", "new"]),
      clientId: z.number().nullable(),
      newFirstName: z.string().trim(),
      newLastName: z.string().trim(),
      newPhone: z.string().trim(),
      staffId: z.string().min(1, "Seleziona un'operatrice"),
      serviceIds: z.array(z.number()),
      scheduledAt: z.string(),
      notes: z.string(),
      status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
    })
    .superRefine((v, ctx) => {
      if (v.clientMode === "existing" && v.clientId == null) {
        ctx.addIssue({ code: "custom", path: ["clientId"], message: "Seleziona una cliente" });
      }
      if (v.clientMode === "new" && !v.newPhone) {
        ctx.addIssue({ code: "custom", path: ["newPhone"], message: "Il telefono è obbligatorio" });
      }
      if (v.scheduledAt && v.scheduledAt !== initialScheduledAt) {
        const d = fromDateTimeLocalValue(v.scheduledAt);
        if (!d) ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Data non valida" });
        else if (d.getTime() < Date.now() - 60_000) {
          ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "La data non può essere nel passato" });
        }
      }
    });
}
type Values = z.infer<ReturnType<typeof buildSchema>>;

const FIELD_MAP: Record<string, keyof Values> = {
  client_id: "clientId",
  "client.phone": "newPhone",
  "client.first_name": "newFirstName",
  "client.last_name": "newLastName",
  staff_id: "staffId",
  service_ids: "serviceIds",
  scheduled_at: "scheduledAt",
};

function splitSearch(search: string): { first: string; last: string; phone: string } {
  if (!search) return { first: "", last: "", phone: "" };
  if (/^[+\d\s]+$/.test(search)) return { first: "", last: "", phone: search };
  const [last = "", ...rest] = search.split(/\s+/);
  return { first: rest.join(" "), last, phone: "" };
}

interface FormProps {
  appointment: Appointment | null;
  defaultDate: Date | null;
  onDone: () => void;
}

function AppointmentFormBody({ appointment, defaultDate, onDone }: FormProps) {
  const isEdit = !!appointment;
  const initialScheduledAt = toDateTimeLocalValue(appointment?.scheduled_at ?? null);

  const staffQuery = useStaff();
  const servicesQuery = useServices();
  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();
  const saveClient = useSaveClient();
  const saveStaff = useSaveStaff();

  const [selectedClient, setSelectedClient] = useState<Client | null>(appointment?.client ?? null);
  const [newStaffOpen, setNewStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyAction, setBusyAction] = useState<null | "whatsapp" | "reminder">(null);

  const schema = useMemo(() => buildSchema(initialScheduledAt), [initialScheduledAt]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientMode: "existing",
      clientId: appointment?.client_id ?? null,
      newFirstName: "",
      newLastName: "",
      newPhone: "",
      staffId: appointment ? String(appointment.staff_id) : "",
      serviceIds: appointment?.services?.map((s) => s.id) ?? [],
      scheduledAt: initialScheduledAt || (defaultDate ? toDateTimeLocalValue(defaultDate) : ""),
      notes: appointment?.notes ?? "",
      status: appointment?.status ?? "pending",
    },
  });

  const clientMode = useWatch({ control, name: "clientMode" });
  const serviceIds = useWatch({ control, name: "serviceIds" });
  const scheduledAt = useWatch({ control, name: "scheduledAt" });

  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const staff = useMemo(() => staffQuery.data ?? [], [staffQuery.data]);

  // Se c'è una sola operatrice la preselezioniamo per velocizzare l'inserimento.
  const onlyStaffId = staff.length === 1 ? String(staff[0].id) : null;
  useEffect(() => {
    if (!isEdit && onlyStaffId && !getValues("staffId")) setValue("staffId", onlyStaffId);
  }, [isEdit, onlyStaffId, getValues, setValue]);

  const totalMinutes = useMemo(() => {
    const sum = services.filter((s) => serviceIds.includes(s.id)).reduce((a, s) => a + s.duration_minutes, 0);
    return sum > 0 ? sum : DEFAULT_APPOINTMENT_MINUTES;
  }, [services, serviceIds]);

  const startDate = fromDateTimeLocalValue(scheduledAt);
  const endDate = startDate ? addMinutes(startDate, totalMinutes) : null;

  function toggleService(id: number) {
    const current = getValues("serviceIds");
    setValue("serviceIds", current.includes(id) ? current.filter((x) => x !== id) : [...current, id], {
      shouldDirty: true,
    });
    clearErrors("serviceIds");
  }

  async function createStaffInline() {
    const name = newStaffName.trim();
    if (!name) return;
    try {
      const s = await saveStaff.mutateAsync({ name });
      setValue("staffId", String(s.id), { shouldValidate: true });
      setNewStaffName("");
      setNewStaffOpen(false);
      toast.success("Operatrice creata");
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossibile creare l'operatrice."));
    }
  }

  async function persist(values: Values): Promise<Appointment | null> {
    const scheduled = fromDateTimeLocalValue(values.scheduledAt);
    const base = {
      staff_id: Number(values.staffId),
      service_ids: values.serviceIds,
      notes: values.notes.trim() || null,
    };

    try {
      if (!appointment) {
        const body: AppointmentInput = { ...base, scheduled_at: scheduled ? toIso(scheduled) : null };
        if (values.clientMode === "existing") body.client_id = values.clientId!;
        else {
          body.client = {
            phone: values.newPhone,
            first_name: values.newFirstName || null,
            last_name: values.newLastName || null,
          };
        }
        return await createAppt.mutateAsync(body);
      }

      let clientId = values.clientId;
      if (values.clientMode === "new") {
        const c = await saveClient.mutateAsync({
          phone: values.newPhone,
          first_name: values.newFirstName || null,
          last_name: values.newLastName || null,
        });
        clientId = c.id;
      }
      return await updateAppt.mutateAsync({
        id: appointment.id,
        ...base,
        client_id: clientId!,
        scheduled_at: scheduled ? toIso(scheduled) : null,
        status: values.status,
      });
    } catch (error) {
      if (!applyServerErrors(error, setError, FIELD_MAP)) toast.error(getErrorMessage(error));
      return null;
    }
  }

  async function submit(values: Values, sendWhatsApp: boolean) {
    const saved = await persist(values);
    if (!saved) return;
    toast.success(isEdit ? "Appuntamento aggiornato" : saved.scheduled_at ? "Appuntamento confermato" : "Appuntamento salvato tra quelli da programmare");
    if (sendWhatsApp && saved.scheduled_at) {
      try {
        openExternal(await fetchWhatsAppUrl(saved.id, "confirmation"));
      } catch (error) {
        toast.error(getErrorMessage(error, "Non riesco a preparare il messaggio WhatsApp."));
      }
    }
    onDone();
  }

  async function sendAction(type: "confirmation" | "reminder") {
    if (!appointment) return;
    setBusyAction(type === "confirmation" ? "whatsapp" : "reminder");
    try {
      openExternal(await fetchWhatsAppUrl(appointment.id, type));
    } catch (error) {
      toast.error(getErrorMessage(error, "Non riesco a preparare il messaggio WhatsApp."));
    } finally {
      setBusyAction(null);
    }
  }

  async function doDelete() {
    if (!appointment) return;
    try {
      await deleteAppt.mutateAsync(appointment.id);
      toast.success("Appuntamento eliminato");
      setConfirmDelete(false);
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossibile eliminare l'appuntamento."));
    }
  }

  if (staffQuery.isLoading || servicesQuery.isLoading) return <ListSkeleton rows={4} />;

  const pending = isSubmitting || createAppt.isPending || updateAppt.isPending;
  const hasDate = !!startDate;

  return (
    <form onSubmit={handleSubmit((v) => submit(v, false))} noValidate className="flex flex-col gap-5">
      {/* Cliente */}
      <Field
        label="Cliente *"
        htmlFor="appt-client"
        error={errors.clientId?.message ?? errors.newPhone?.message}
      >
        {clientMode === "existing" ? (
          <Controller
            control={control}
            name="clientId"
            render={({ field }) => (
              <ClientPicker
                id="appt-client"
                selected={selectedClient}
                invalid={!!errors.clientId}
                onSelect={(c) => {
                  setSelectedClient(c);
                  field.onChange(c?.id ?? null);
                  clearErrors("clientId");
                }}
                onCreateNew={(search) => {
                  const p = splitSearch(search);
                  setValue("clientMode", "new");
                  setValue("newFirstName", p.first);
                  setValue("newLastName", p.last);
                  setValue("newPhone", p.phone);
                  clearErrors("clientId");
                }}
              />
            )}
          />
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <UserPlusIcon className="size-4" /> Nuova cliente
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue("clientMode", "existing");
                  clearErrors("newPhone");
                }}
              >
                <XIcon /> Annulla
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Cognome" aria-label="Cognome" autoComplete="off" {...register("newLastName")} />
              <Input placeholder="Nome" aria-label="Nome" autoComplete="off" {...register("newFirstName")} />
            </div>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="Telefono *"
              aria-label="Telefono"
              autoComplete="off"
              aria-invalid={!!errors.newPhone}
              {...register("newPhone")}
            />
            <p className="text-xs text-muted-foreground">
              Se il telefono esiste già, verrà usata la cliente esistente.
            </p>
          </div>
        )}
      </Field>

      {/* Staff */}
      <Field label="Operatrice *" htmlFor="appt-staff" error={errors.staffId?.message}>
        <NativeSelect id="appt-staff" aria-invalid={!!errors.staffId} {...register("staffId")}>
          <option value="">Seleziona…</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
        {newStaffOpen ? (
          <div className="flex gap-2">
            <Input
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              placeholder="Nome nuova operatrice"
              aria-label="Nome nuova operatrice"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createStaffInline();
                }
              }}
            />
            <Button type="button" onClick={createStaffInline} disabled={saveStaff.isPending || !newStaffName.trim()}>
              Aggiungi
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNewStaffOpen(true)}
            className="flex min-h-9 items-center gap-1 self-start text-sm font-medium text-primary"
          >
            <PlusIcon className="size-4" /> Nuova operatrice
          </button>
        )}
      </Field>

      {/* Servizi */}
      <Field label="Servizi" error={errors.serviceIds?.message}>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun servizio disponibile. Creane uno dalla sezione Servizi.</p>
        ) : (
          <div role="group" aria-label="Servizi" className="flex flex-wrap gap-2">
            {services.map((s) => (
              <ServiceChip key={s.id} service={s} selected={serviceIds.includes(s.id)} onToggle={() => toggleService(s.id)} />
            ))}
          </div>
        )}
      </Field>

      {/* Data e ora */}
      <Field
        label="Data e ora"
        htmlFor="appt-date"
        error={errors.scheduledAt?.message}
        hint="Lascia vuoto per metterlo tra gli appuntamenti da programmare."
      >
        <div className="flex gap-2">
          <Input
            id="appt-date"
            type="datetime-local"
            step={900}
            min={isEdit && initialScheduledAt ? undefined : nowDateTimeLocal()}
            aria-invalid={!!errors.scheduledAt}
            className="min-w-0 flex-1"
            {...register("scheduledAt")}
          />
          {hasDate ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Rimuovi data"
              onClick={() => setValue("scheduledAt", "", { shouldDirty: true })}
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Durata totale: <strong className="text-foreground">{formatDuration(totalMinutes)}</strong>
          {serviceIds.length === 0 ? " (predefinita)" : ""}
          {endDate ? (
            <>
              {" · "}Fine: <strong className="text-foreground">{formatTime(endDate)}</strong>
            </>
          ) : null}
        </p>
      </Field>

      {/* Stato (solo modifica) */}
      {isEdit ? (
        <Field label="Stato" htmlFor="appt-status" error={errors.status?.message}>
          <NativeSelect id="appt-status" {...register("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}

      <Field label="Note" htmlFor="appt-notes" error={errors.notes?.message}>
        <Textarea id="appt-notes" rows={3} {...register("notes")} />
      </Field>

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvataggio…" : "Salva"}
        </Button>
        {hasDate ? (
          <Button
            type="button"
            size="lg"
            variant="secondary"
            disabled={pending}
            onClick={handleSubmit((v) => submit(v, true))}
          >
            <MessageCircleIcon /> Salva e invia WhatsApp
          </Button>
        ) : null}
      </div>

      {isEdit ? (
        <div className="flex flex-col gap-2 border-t pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={!appointment?.scheduled_at || busyAction !== null}
              onClick={() => sendAction("confirmation")}
            >
              <MessageCircleIcon /> Conferma
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={!appointment?.scheduled_at || busyAction !== null}
              onClick={() => sendAction("reminder")}
            >
              <BellIcon /> Ricorda
            </Button>
          </div>
          {appointment?.whatsapp_sent ? (
            <p className="text-center text-xs text-muted-foreground">Conferma WhatsApp già inviata.</p>
          ) : null}
          <Button type="button" variant="destructive" size="lg" onClick={() => setConfirmDelete(true)}>
            <Trash2Icon /> Elimina appuntamento
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminare l'appuntamento?"
        description="L'azione non si può annullare."
        loading={deleteAppt.isPending}
        onConfirm={doDelete}
      />
    </form>
  );
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment = null,
  defaultDate = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultDate?: Date | null;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={appointment ? "Modifica appuntamento" : "Nuovo appuntamento"}
    >
      {open ? (
        <AppointmentFormBody
          key={appointment?.id ?? `new-${defaultDate?.getTime() ?? "x"}`}
          appointment={appointment}
          defaultDate={defaultDate}
          onDone={() => onOpenChange(false)}
        />
      ) : null}
    </ResponsiveDialog>
  );
}
