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
  /** Listino attuale */
  price: number | null;
}

export function effectivePrice(s: SelectedService, item: CatalogItem | undefined): number | null {
  const parsed = parsePrice(s.price);
  if (parsed === undefined) return null;
  // Campo vuoto: il backend copia il listino.
  return parsed === null ? (item?.price ?? null) : parsed;
}

/** Totale in euro e numero di servizi senza prezzo. La durata NON dipende dai servizi. */
export function serviceTotals(selected: SelectedService[], catalog: Map<number, CatalogItem>) {
  let cents = 0;
  let unpriced = 0;
  for (const s of selected) {
    const item = catalog.get(s.id);
    const price = effectivePrice(s, item);
    if (price === null) unpriced += 1;
    else cents += Math.round(price * 100);
  }
  return {
    total: cents / 100,
    unpriced,
  };
}
