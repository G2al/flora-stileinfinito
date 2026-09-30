import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { getFieldErrors } from "@/lib/api";

/** Mappa gli errori 422 del backend sui campi del form. Ritorna true se ne ha mappato almeno uno. */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  map: Record<string, Path<T>> = {},
): boolean {
  const errors = getFieldErrors(error);
  let applied = false;
  for (const [key, message] of Object.entries(errors)) {
    const field = (map[key] ?? key) as Path<T>;
    setError(field, { type: "server", message });
    applied = true;
  }
  return applied;
}
