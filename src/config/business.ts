/**
 * Orari di apertura del centro.
 * ATTENZIONE: valori PROVVISORI, da confermare con la cliente.
 */
export const BUSINESS_HOURS = {
  open: "09:00",
  close: "19:00",
  /** 0 = domenica, 1 = lunedì ... 6 = sabato */
  daysOfWeek: [1, 2, 3, 4, 5, 6],
  slotMinutes: 15,
} as const;

/**
 * Finestra ORARIA VISIBILE nel calendario: più ampia degli orari di apertura, altrimenti gli
 * appuntamenti fuori orario (es. alle 8 o dopo le 19) non verrebbero disegnati.
 */
export const CALENDAR_VISIBLE_HOURS = {
  start: "06:00",
  end: "21:00",
} as const;

export const DEFAULT_SERVICE_COLOR = "#16a34a";
export const DEFAULT_APPOINTMENT_MINUTES = 30;
export const APP_NAME = "Flora Stile Infinito";
