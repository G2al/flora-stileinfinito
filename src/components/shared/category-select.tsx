"use client";

import { NativeSelect } from "@/components/ui/native-select";
import type { ServiceCategory } from "@/types";

interface Props extends Omit<React.ComponentProps<"select">, "value" | "onChange"> {
  tree: ServiceCategory[];
  /** "" = nessuna selezione */
  value: string;
  onChange: (value: string) => void;
  /** Testo della voce vuota, es. "Tutte le categorie" o "Nessuna categoria" */
  emptyLabel: string;
}

/** Select raggruppata: per ogni categoria la voce generale e le sottocategorie ("Estetica > Viso"). */
export function CategorySelect({ tree, value, onChange, emptyLabel, ...props }: Props) {
  return (
    <NativeSelect value={value} onChange={(e) => onChange(e.target.value)} {...props}>
      <option value="">{emptyLabel}</option>
      {tree.map((c) => (
        <optgroup key={c.id} label={c.name}>
          <option value={c.id}>{c.children.length > 0 ? `${c.name} (tutta)` : c.name}</option>
          {c.children.map((s) => (
            <option key={s.id} value={s.id}>
              {c.name} &gt; {s.name}
            </option>
          ))}
        </optgroup>
      ))}
    </NativeSelect>
  );
}
