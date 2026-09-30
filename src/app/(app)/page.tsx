"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { AppointmentFormDialog } from "@/components/appointments/appointment-form";
import { ScheduleDialog } from "@/components/appointments/schedule-dialog";
import { CalendarView } from "@/components/calendar/calendar-view";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ToScheduleList } from "@/components/dashboard/to-schedule-list";
import { PageHeader } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types";

interface FormState {
  open: boolean;
  appointment: Appointment | null;
  defaultDate: Date | null;
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>({ open: false, appointment: null, defaultDate: null });
  const [scheduling, setScheduling] = useState<Appointment | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const openNew = (date: Date | null = null) => setForm({ open: true, appointment: null, defaultDate: date });
  const openEdit = (appointment: Appointment) => setForm({ open: true, appointment, defaultDate: null });

  return (
    // Su telefono il calendario occupa tutta l'altezza: compensiamo il padding in basso del layout.
    <div className="mx-auto -mb-[5.5rem] max-w-7xl md:mb-0">
      <div className="hidden md:block">
        <PageHeader
          title="Calendario"
          actions={
            <Button size="lg" onClick={() => openNew()}>
              <PlusIcon /> Nuovo appuntamento
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        <StatsCards onOpenToSchedule={() => setPanelOpen(true)} />
        <CalendarView onNewAt={openNew} onEdit={openEdit} />
      </div>

      {/* Desktop: lista sotto il calendario */}
      <div className="hidden md:block">
        <ToScheduleList onSchedule={setScheduling} onEdit={openEdit} />
      </div>

      {/* Telefono: lista in un pannello */}
      <div className="md:hidden">
        <ResponsiveDialog open={panelOpen} onOpenChange={setPanelOpen} title="Da programmare">
          <ToScheduleList
            embedded
            onSchedule={(a) => {
              setPanelOpen(false);
              setScheduling(a);
            }}
            onEdit={(a) => {
              setPanelOpen(false);
              openEdit(a);
            }}
          />
        </ResponsiveDialog>
      </div>

      {/* FAB mobile */}
      <Button
        size="icon-lg"
        aria-label="Nuovo appuntamento"
        onClick={() => openNew()}
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
        className="fixed right-4 z-30 size-12 rounded-full shadow-lg md:hidden"
      >
        <PlusIcon className="size-6" />
      </Button>

      <AppointmentFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        appointment={form.appointment}
        defaultDate={form.defaultDate}
      />
      <ScheduleDialog appointment={scheduling} onOpenChange={(o) => !o && setScheduling(null)} />
    </div>
  );
}
