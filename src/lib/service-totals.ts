import { DEFAULT_APPOINTMENT_MINUTES } from "@/config/business";
import { parsePrice } from "@/lib/money";

export interface SelectedService {
  id: number;
  /** Testo digitato; vuoto = prezzo di listino (se il servizio ne ha uno) */
  price: string;
}

export interface CatalogItem {
  id: number;
  name: string;
  color: string | null;
  duration_minutes: number | null;
  /** Listino attuale */
  price: number | null;
}

export function effectivePrice(s: SelectedService, item: CatalogItem | undefined): number | null {
  const parsed = parsePrice(s.price);
  if (parsed === undefined) return null;
  // Campo vuoto: il backend copia il listino.
  return parsed === null ? (item?.price ?? null) : parsed;
}

/** Totale in euro, servizi senza prezzo, durata (somma di quelle specificate, altrimenti 30 minuti). */
export function serviceTotals(selected: SelectedService[], catalog: Map<number, CatalogItem>) {
  let cents = 0;
  let unpriced = 0;
  let minutes = 0;
  let hasDuration = false;
  for (const s of selected) {
    const item = catalog.get(s.id);
    const price = effectivePrice(s, item);
    if (price === null) unpriced += 1;
    else cents += Math.round(price * 100);
    if (item?.duration_minutes) {
      minutes += item.duration_minutes;
      hasDuration = true;
    }
  }
  return {
    total: cents / 100,
    unpriced,
    minutes: hasDuration ? minutes : DEFAULT_APPOINTMENT_MINUTES,
    isDefaultDuration: !hasDuration,
  };
}
