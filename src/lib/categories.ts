import type { ServiceCategory } from "@/types";

export interface FlatCategory {
  id: number;
  /** "Estetica" oppure "Estetica > Viso" */
  label: string;
  parentId: number | null;
  parentName: string | null;
  name: string;
}

/** Appiattisce l'albero (ordine: categoria, poi le sue sottocategorie). */
export function flattenCategories(tree: ServiceCategory[]): FlatCategory[] {
  const out: FlatCategory[] = [];
  for (const c of tree) {
    out.push({ id: c.id, label: c.name, parentId: null, parentName: null, name: c.name });
    for (const s of c.children) {
      out.push({ id: s.id, label: `${c.name} > ${s.name}`, parentId: c.id, parentName: c.name, name: s.name });
    }
  }
  return out;
}

/** "Estetica > Viso" a partire dalla categoria del servizio (riferimento a due livelli). */
export function categoryPath(
  category: { name: string; parent_id: number | null } | null | undefined,
  flat: FlatCategory[],
): string | null {
  if (!category) return null;
  const hit = flat.find((f) => f.label.endsWith(category.name) && (category.parent_id === null ? f.parentId === null : f.parentId === category.parent_id));
  return hit?.label ?? category.name;
}
