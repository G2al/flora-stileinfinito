"use client";

import { useMemo, useState } from "react";
import { XIcon } from "lucide-react";
import { useServiceCategories } from "@/api/service-categories";
import { DEFAULT_SERVICE_COLOR } from "@/config/business";
import { fmtEuro, parsePrice } from "@/lib/money";
import { effectivePrice, type CatalogItem, type SelectedService } from "@/lib/service-totals";
import type { Service } from "@/types";
import { Input } from "@/components/ui/input";
import { CategorySelect } from "@/components/shared/category-select";
import { ServiceChip } from "@/components/shared/service-chip";

interface Props {
  /** Tutti i servizi del listino */
  services: Service[];
  catalog: Map<number, CatalogItem>;
  value: SelectedService[];
  onChange: (next: SelectedService[]) => void;
  /** Errore del prezzo del servizio i-esimo */
  priceError: (index: number) => string | undefined;
}

/** Due passi opzionali: categoria (anche "Tutte") e poi i servizi; per ogni servizio scelto il prezzo è modificabile. */
export function ServicePicker({ services, catalog, value, onChange, priceError }: Props) {
  const categories = useServiceCategories();
  const tree = useMemo(() => categories.data ?? [], [categories.data]);
  const [categoryId, setCategoryId] = useState("");

  const visible = useMemo(() => {
    if (!categoryId) return services;
    const id = Number(categoryId);
    return services.filter((s) => s.category_id === id || s.category?.parent_id === id);
  }, [services, categoryId]);

  const isSelected = (id: number) => value.some((s) => s.id === id);

  function toggle(service: Service) {
    if (isSelected(service.id)) onChange(value.filter((s) => s.id !== service.id));
    else onChange([...value, { id: service.id, price: service.price !== null ? String(service.price).replace(".", ",") : "" }]);
  }

  function setPrice(index: number, price: string) {
    onChange(value.map((s, i) => (i === index ? { ...s, price } : s)));
  }

  return (
    <div className="flex flex-col gap-3">
      {tree.length > 0 ? (
        <CategorySelect
          aria-label="Filtra i servizi per categoria"
          tree={tree}
          value={categoryId}
          onChange={setCategoryId}
          emptyLabel="Tutte le categorie"
        />
      ) : null}

      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun servizio disponibile. Creane uno dalla sezione Servizi.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun servizio in questa categoria.</p>
      ) : (
        <div role="group" aria-label="Servizi" className="flex flex-wrap gap-2">
          {visible.map((s) => (
            <ServiceChip key={s.id} service={s} selected={isSelected(s.id)} onToggle={() => toggle(s)} />
          ))}
        </div>
      )}

      {value.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-xl border bg-muted/20" aria-label="Servizi scelti e prezzi">
          {value.map((sel, i) => {
            const item = catalog.get(sel.id);
            const listino = item?.price ?? null;
            const parsed = parsePrice(sel.price);
            const effective = effectivePrice(sel, item);
            const differs = parsed !== undefined && parsed !== null && listino !== null && parsed !== listino;
            const err = priceError(i);
            return (
              <li key={sel.id} className="flex flex-col gap-1 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item?.color || DEFAULT_SERVICE_COLOR }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item?.name ?? `Servizio ${sel.id}`}</span>
                  <div className="relative w-28 shrink-0">
                    <Input
                      inputMode="decimal"
                      autoComplete="off"
                      aria-label={`Prezzo di ${item?.name ?? "servizio"} in euro`}
                      aria-invalid={!!err}
                      placeholder={listino !== null ? String(listino).replace(".", ",") : "—"}
                      value={sel.price}
                      onChange={(e) => setPrice(i, e.target.value)}
                      className="pr-7 text-right tabular-nums"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Rimuovi ${item?.name ?? "servizio"}`}
                    onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
                {err ? (
                  <p role="alert" className="text-sm text-destructive">
                    {err}
                  </p>
                ) : differs ? (
                  <p className="pl-[1.125rem] text-xs text-amber-700 dark:text-amber-400">Diverso dal listino ({fmtEuro(listino!)})</p>
                ) : effective === null ? (
                  <p className="pl-[1.125rem] text-xs text-muted-foreground">Nessun prezzo</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
