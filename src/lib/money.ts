const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

/** "30,00 €" */
export const fmtEuro = (n: number) => eur.format(n);

/**
 * Legge un importo digitato ("30", "30,5", "30.50").
 * Ritorna null se il campo è vuoto, undefined se non è valido.
 */
export function parsePrice(input: string): number | null | undefined {
  const t = input.trim().replace(",", ".");
  if (t === "") return null;
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(t)) return undefined;
  return Number(t);
}

/** Importo -> testo per un campo di input ("30,5"), vuoto se null. */
export function priceToInput(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : String(n).replace(".", ",");
}
