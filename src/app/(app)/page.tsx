"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { AppointmentFormDialog } from "@/components/appointments/appointment-form";
import { ScheduleDialog } from "@/components/appointments/schedule-dialog";
import { CalendarView } from "@/components/calendar/calendar-view";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ToScheduleList } from "@/components/dashboard/to-schedule-list";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import type { Appointment } from "@/types";

interface FormState {
  open: boolean;
  appointment: Appointment | null;
  defaultDate: Date | null;
}

export default function HomePage() {
  const isDesktop = useIsDesktop();
  const [form, setForm] = useState<FormState>({ open: false, appointment: null, defaultDate: null });
  const [scheduling, setScheduling] = useState<Appointment | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const openNew = (date: Date | null = null) => setForm({ open: true, appointment: null, defaultDate: date });
  const openEdit = (appointment: Appointment) => setForm({ open: true, appointment, defaultDate: null });

  const toSchedule = (
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
  );

  return (
    // Il calendario occupa tutta l'altezza: compensiamo il padding in basso del layout.
    <div className="-mb-[5.5rem] md:-mb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <StatsCards onOpenToSchedule={() => setPanelOpen(true)} />
        </div>
        <Button size="lg" className="hidden shrink-0 md:inline-flex" onClick={() => openNew()}>
          <PlusIcon /> Nuovo appuntamento
        </Button>
      </div>

      <CalendarView onNewAt={openNew} onEdit={openEdit} />

      {/* Da programmare: pannello laterale su desktop, foglio dal basso su telefono */}
      {isDesktop ? (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
            <SheetHeader className="border-b p-4 pr-14">
              <SheetTitle className="text-lg">Da programmare</SheetTitle>
              <SheetDescription>Appuntamenti in attesa di una data</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">{toSchedule}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <ResponsiveDialog open={panelOpen} onOpenChange={setPanelOpen} title="Da programmare">
          {toSchedule}
        </ResponsiveDialog>
      )}

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
