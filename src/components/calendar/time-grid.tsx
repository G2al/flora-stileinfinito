"use client";

import { useEffect, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import type { EventClickArg, EventContentArg, EventDropArg, EventInput } from "@fullcalendar/core";
import { toast } from "sonner";
import { useUpdateAppointment } from "@/api/appointments";
import { BUSINESS_HOURS, CALENDAR_VISIBLE_HOURS } from "@/config/business";
import { getErrorMessage } from "@/lib/api";
import { formatTime, toIso } from "@/lib/dates";
import { clientFullName } from "@/lib/format";
import type { Appointment } from "@/types";
import { apptColor, textOn } from "@/components/calendar/calendar-utils";

export type GridView = "day" | "3days" | "week" | "month";

const FC_VIEW: Record<GridView, string> = {
  day: "timeGridDay",
  "3days": "timeGridThreeDay",
  week: "timeGridWeek",
  month: "dayGridMonth",
};

function toEvent(a: Appointment): EventInput {
  const color = apptColor(a);
  return {
    id: String(a.id),
    title: clientFullName(a.client),
    start: a.scheduled_at ?? undefined,
    end: a.ends_at ?? undefined,
    backgroundColor: color,
    borderColor: color,
    textColor: textOn(color),
    extendedProps: { appointment: a },
  };
}

interface Props {
  view: GridView;
  anchor: Date;
  appointments: Appointment[];
  height: number;
  showStaff: boolean;
  onNewAt: (date: Date) => void;
  onEdit: (a: Appointment) => void;
}

export function TimeGrid({ view, anchor, appointments, height, showStaff, onNewAt, onEdit }: Props) {
  const calRef = useRef<FullCalendar>(null);
  const update = useUpdateAppointment();

  const events = useMemo(() => appointments.filter((a) => a.scheduled_at).map(toEvent), [appointments]);

  const scrollTime = useMemo(() => {
    const openHour = parseInt(BUSINESS_HOURS.open, 10);
    const hour = Math.max(openHour, new Date().getHours() - 1);
    return `${String(hour).padStart(2, "0")}:00:00`;
  }, []);

  // Sincronizza la data quando l'utente naviga con la nostra toolbar.
  useEffect(() => {
    calRef.current?.getApi().gotoDate(anchor);
  }, [anchor]);

  function onDateClick(arg: DateClickArg) {
    const date = new Date(arg.date);
    if (arg.allDay) {
      const [h, m] = BUSINESS_HOURS.open.split(":").map(Number);
      date.setHours(h, m, 0, 0);
    }
    if (date.getTime() < Date.now() - 15 * 60_000) {
      toast.info("Non puoi creare appuntamenti nel passato.");
      return;
    }
    onNewAt(date);
  }

  function onEventClick(arg: EventClickArg) {
    arg.jsEvent.preventDefault();
    onEdit(arg.event.extendedProps.appointment as Appointment);
  }

  async function onEventDrop(arg: EventDropArg) {
    const a = arg.event.extendedProps.appointment as Appointment;
    const start = arg.event.start;
    if (!start || arg.event.allDay || start.getTime() < Date.now()) {
      arg.revert();
      toast.info("Non puoi spostare l'appuntamento nel passato.");
      return;
    }
    try {
      await update.mutateAsync({ id: a.id, scheduled_at: toIso(start) });
      toast.success("Appuntamento spostato");
    } catch (error) {
      arg.revert();
      toast.error(getErrorMessage(error, "Impossibile spostare l'appuntamento."));
    }
  }

  function renderEvent(arg: EventContentArg) {
    const a = arg.event.extendedProps.appointment as Appointment;
    const services = a.services?.map((s) => s.name).join(" + ");
    const start = formatTime(a.scheduled_at);

    if (view === "month") {
      return (
        <div className="flex min-w-0 px-1 py-px text-[11px] leading-tight">
          <span className="truncate font-semibold">
            {start} {arg.event.title}
          </span>
        </div>
      );
    }

    return (
      <div className="flex h-full min-w-0 flex-col overflow-hidden px-1.5 py-0.5 text-[11px] leading-tight">
        <div className="flex items-start justify-between gap-1">
          <span className="truncate text-xs font-semibold">{arg.event.title}</span>
          {showStaff && a.staff ? (
            <span className="shrink-0 rounded bg-black/20 px-1 py-px text-[10px] font-medium">{a.staff.name}</span>
          ) : null}
        </div>
        <span className="truncate opacity-95">
          {start}–{formatTime(a.ends_at)}
          {services ? ` · ${services}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <FullCalendar
        // Cambiare vista = rimontare: più semplice e affidabile del changeView.
        key={view}
        ref={calRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={FC_VIEW[view]}
        initialDate={anchor}
        views={{
          timeGridThreeDay: { type: "timeGrid", duration: { days: 3 } },
          dayGridMonth: { dayHeaderFormat: { weekday: "short" } },
        }}
        headerToolbar={false}
        dayHeaders={view !== "day"}
        locale={itLocale}
        firstDay={1}
        height={height}
        allDaySlot={false}
        nowIndicator
        slotDuration="00:15:00"
        slotLabelInterval="01:00"
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        slotMinTime={`${CALENDAR_VISIBLE_HOURS.start}:00`}
        slotMaxTime={`${CALENDAR_VISIBLE_HOURS.end}:00`}
        scrollTime={scrollTime}
        businessHours={{
          daysOfWeek: [...BUSINESS_HOURS.daysOfWeek],
          startTime: BUSINESS_HOURS.open,
          endTime: BUSINESS_HOURS.close,
        }}
        dayMaxEvents={view === "month" ? true : 3}
        expandRows
        dayMaxEventRows={false}
        fixedWeekCount={false}
        editable
        eventDurationEditable={false}
        eventLongPressDelay={400}
        longPressDelay={400}
        events={events}
        eventContent={renderEvent}
        dateClick={onDateClick}
        eventClick={onEventClick}
        eventDrop={onEventDrop}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
      />
    </div>
  );
}
