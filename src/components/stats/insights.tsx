import { LightbulbIcon } from "lucide-react";

export function Insights({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="In breve" className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
        <LightbulbIcon className="size-4" aria-hidden /> In breve
      </h2>
      <ul className="flex flex-col gap-1.5 text-sm">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}
