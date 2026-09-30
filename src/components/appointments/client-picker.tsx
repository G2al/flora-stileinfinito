"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, PhoneIcon, SearchIcon, UserPlusIcon, XIcon } from "lucide-react";
import { useClients } from "@/api/clients";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { clientFullName, clientLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Client } from "@/types";
import { Input } from "@/components/ui/input";

interface Props {
  selected: Client | null;
  onSelect: (client: Client | null) => void;
  /** L'utente ha scelto "Crea nuovo cliente" con questo testo di ricerca. */
  onCreateNew: (search: string) => void;
  invalid?: boolean;
  id?: string;
}

/** Combobox cercabile: input di ricerca su /clients?q= con debounce. */
export function ClientPicker({ selected, onSelect, onCreateNew, invalid, id }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), 250);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isFetching } = useClients({ q, per_page: 8 }, open);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          onClick={() => setOpen(true)}
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
            invalid && "border-destructive",
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? clientFullName(selected) : "Cerca una cliente…"}
          </span>
          {selected ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Rimuovi cliente"
              className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelect(null);
                }
              }}
            >
              <XIcon className="size-4" />
            </span>
          ) : (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
        </button>
        {selected ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <PhoneIcon className="size-3.5" />
            {selected.phone}
          </p>
        ) : null}
      </div>
    );
  }

  const results = data?.data ?? [];

  return (
    <div className="overflow-hidden rounded-lg border bg-popover">
      <div className="relative border-b">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, cognome o telefono"
          aria-label="Cerca cliente"
          autoComplete="off"
          className="rounded-none border-0 pl-9 focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
            }
          }}
        />
      </div>
      <ul role="listbox" aria-label="Clienti" className="max-h-56 overflow-y-auto">
        {results.map((c) => (
          <li key={c.id} role="option" aria-selected={selected?.id === c.id}>
            <button
              type="button"
              className="flex min-h-11 w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(c);
                setOpen(false);
                setSearch("");
              }}
            >
              <span className="truncate">{clientLabel(c)}</span>
            </button>
          </li>
        ))}
        {results.length === 0 ? (
          <li className="px-3 py-3 text-sm text-muted-foreground">
            {isFetching ? "Ricerca in corso…" : "Nessuna cliente trovata."}
          </li>
        ) : null}
        <li>
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted"
            onClick={() => {
              onCreateNew(search.trim());
              setOpen(false);
              setSearch("");
            }}
          >
            <UserPlusIcon className="size-4" />
            Crea nuovo cliente{search.trim() ? ` “${search.trim()}”` : ""}
          </button>
        </li>
      </ul>
      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-center border-t text-xs text-muted-foreground hover:bg-muted"
        onClick={() => setOpen(false)}
      >
        Chiudi ricerca
      </button>
    </div>
  );
}
