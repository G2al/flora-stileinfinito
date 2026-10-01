/** Evento con cui le mutation chiedono un unico refetch ritardato (la conferma WhatsApp parte dopo la risposta HTTP). */
export const DELAYED_REFRESH_EVENT = "appointments:delayed-refresh";
export const DELAYED_REFRESH_MS = 4000;

export function requestDelayedAppointmentsRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DELAYED_REFRESH_EVENT));
}
