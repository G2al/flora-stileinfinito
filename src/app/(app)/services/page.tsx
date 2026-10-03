"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FolderTreeIcon, PencilIcon, PlusIcon, ScissorsIcon, Trash2Icon } from "lucide-react";
import { useServiceCategories } from "@/api/service-categories";
import { useDeleteService, useSaveService, useServices } from "@/api/services";
import { DEFAULT_SERVICE_COLOR } from "@/config/business";
import { getErrorMessage } from "@/lib/api";
import { categoryPath, flattenCategories } from "@/lib/categories";
import { applyServerErrors } from "@/lib/form-errors";
import { fmtEuro, parsePrice, priceToInput } from "@/lib/money";
import type { Service, ServiceCategory } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySelect } from "@/components/shared/category-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, Field, ListSkeleton, PageHeader } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

const schema = z
  .object({
    name: z.string().trim().min(1, "Inserisci il nome").max(255),
    categoryId: z.string(),
    price: z.string(),
    duration: z.string(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colore non valido"),
  })
  .superRefine((v, ctx) => {
    if (parsePrice(v.price) === undefined) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Importo non valido (es. 30 oppure 30,50)" });
    }
    const d = v.duration.trim();
    if (d !== "") {
      const n = Number(d);
      if (!Number.isInteger(n) || n < 5 || n > 720) {
        ctx.addIssue({ code: "custom", path: ["duration"], message: "Da 5 a 720 minuti, oppure lascia vuoto" });
      }
    }
  });
type Values = z.infer<typeof schema>;

const FIELD_MAP: Record<string, keyof Values> = {
  duration_minutes: "duration",
  category_id: "categoryId",
};

function ServiceForm({
  service,
  tree,
  onDone,
}: {
  service: Service | null;
  tree: ServiceCategory[];
  onDone: () => void;
}) {
  const save = useSaveService();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? "",
      categoryId: service?.category_id ? String(service.category_id) : "",
      price: priceToInput(service?.price),
      duration: service?.duration_minutes ? String(service.duration_minutes) : "",
      color: service?.color ?? DEFAULT_SERVICE_COLOR,
    },
  });
  const color = useWatch({ control, name: "color" });
  const categoryId = useWatch({ control, name: "categoryId" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        id: service?.id,
        name: values.name,
        color: values.color,
        category_id: values.categoryId ? Number(values.categoryId) : null,
        price: parsePrice(values.price) ?? null,
        duration_minutes: values.duration.trim() === "" ? null : Number(values.duration),
      });
      toast.success(service ? "Servizio aggiornato" : "Servizio creato");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, FIELD_MAP)) toast.error(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Nome" htmlFor="service-name" error={errors.name?.message}>
        <Input id="service-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
      </Field>

      <Field label="Categoria" htmlFor="service-category" error={errors.categoryId?.message}>
        <CategorySelect
          id="service-category"
          tree={tree}
          value={categoryId}
          onChange={(v) => setValue("categoryId", v, { shouldDirty: true })}
          emptyLabel="Nessuna categoria"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prezzo di listino (€)" htmlFor="service-price" error={errors.price?.message}>
          <Input
            id="service-price"
            inputMode="decimal"
            placeholder="es. 30"
            autoComplete="off"
            aria-invalid={!!errors.price}
            {...register("price")}
          />
        </Field>
        <Field label="Durata (minuti)" htmlFor="service-duration" error={errors.duration?.message}>
          <Input
            id="service-duration"
            type="number"
            inputMode="numeric"
            min={5}
            max={720}
            step={5}
            placeholder="opzionale"
            aria-invalid={!!errors.duration}
            {...register("duration")}
          />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Prezzo e durata sono facoltativi: lascia vuoto se non specificati.</p>

      <Field label="Colore" htmlFor="service-color" error={errors.color?.message}>
        <div className="flex items-center gap-3">
          <input
            id="service-color"
            type="color"
            aria-label="Scegli il colore"
            className="h-11 w-16 cursor-pointer rounded-lg border border-input bg-transparent p-1"
            {...register("color")}
          />
          <span className="font-mono text-sm text-muted-foreground uppercase">{color}</span>
        </div>
      </Field>
      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending ? "Salvataggio…" : "Salva"}
      </Button>
    </form>
  );
}

export default function ServicesPage() {
  const [filter, setFilter] = useState("");
  const categories = useServiceCategories();
  const tree = useMemo(() => categories.data ?? [], [categories.data]);
  const flat = useMemo(() => flattenCategories(tree), [tree]);

  const { data, isLoading, isError, refetch } = useServices(filter ? Number(filter) : undefined);
  const del = useDeleteService();
  const [editing, setEditing] = useState<Service | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  function openForm(s: Service | null) {
    setEditing(s);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Servizio eliminato");
      setToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossibile eliminare il servizio."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Servizi"
        description="Trattamenti, prezzi e durate"
        actions={
          <>
            <Link href="/services/categories" className={buttonVariants({ variant: "outline" })}>
              <FolderTreeIcon /> <span className="hidden sm:inline">Categorie</span>
            </Link>
            <Button onClick={() => openForm(null)}>
              <PlusIcon /> Nuovo
            </Button>
          </>
        }
      />

      {tree.length > 0 ? (
        <div className="mb-4">
          <CategorySelect
            aria-label="Filtra per categoria"
            tree={tree}
            value={filter}
            onChange={setFilter}
            emptyLabel="Tutte le categorie"
          />
        </div>
      ) : null}

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={ScissorsIcon}
          title={filter ? "Nessun servizio in questa categoria" : "Nessun servizio"}
          description={
            filter ? "Scegli un'altra categoria o aggiungi un servizio." : "Crea i servizi offerti dal centro per poterli assegnare agli appuntamenti."
          }
          action={<Button onClick={() => openForm(null)}>Aggiungi servizio</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data?.map((s) => {
            const path = categoryPath(s.category, flat);
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <span
                  className="size-4 shrink-0 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: s.color || DEFAULT_SERVICE_COLOR }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                    {path ? <span className="truncate">{path}</span> : null}
                    <span className="tabular-nums">{s.price !== null ? fmtEuro(s.price) : "—"}</span>
                    <span className="tabular-nums">{s.duration_minutes ? `${s.duration_minutes} min` : "—"}</span>
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Modifica ${s.name}`} onClick={() => openForm(s)}>
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Elimina ${s.name}`}
                  className="text-destructive"
                  onClick={() => setToDelete(s)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ResponsiveDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Modifica servizio" : "Nuovo servizio"}
        className="sm:max-w-sm"
      >
        {formOpen ? (
          <ServiceForm key={editing?.id ?? "new"} service={editing} tree={tree} onDone={() => setFormOpen(false)} />
        ) : null}
      </ResponsiveDialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminare il servizio?"
        description={toDelete ? `“${toDelete.name}” verrà eliminato.` : undefined}
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
