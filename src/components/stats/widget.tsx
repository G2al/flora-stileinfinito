import { cn } from "@/lib/utils";

export function Widget({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-4", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function WidgetEmpty({ children = "Nessun dato nel periodo." }: { children?: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
