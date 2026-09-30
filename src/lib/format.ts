import type { Client } from "@/types";

type ClientLike = Pick<Client, "first_name" | "last_name" | "phone">;

/** "Cognome Nome", oppure il telefono se mancano i nomi. */
export function clientFullName(c: ClientLike | undefined | null): string {
  if (!c) return "—";
  const name = [c.last_name, c.first_name].filter(Boolean).join(" ").trim();
  return name || c.phone;
}

/** "Cognome Nome - telefono" */
export function clientLabel(c: ClientLike): string {
  const name = [c.last_name, c.first_name].filter(Boolean).join(" ").trim();
  return name ? `${name} - ${c.phone}` : c.phone;
}
