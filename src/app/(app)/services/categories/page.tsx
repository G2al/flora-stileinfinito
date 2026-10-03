"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeftIcon, CornerDownRightIcon, FolderPlusIcon, FolderTreeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useDeleteServiceCategory, useSaveServiceCategory, useServiceCategories } from "@/api/service-categories";
import { getErrorMessage } from "@/lib/api";
import { applyServerErrors } from "@/lib/form-errors";
import type { ServiceCategory } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, Field, ListSkeleton, PageHeader } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Inserisci il nome").max(255),
  parentId: z.string(),
});
type Values = z.infer<typeof schema>;

interface FormTarget {
  /** Categoria in modifica (null = nuova) */
  category: ServiceCategory | null;
  /** Categoria principale preselezionata per una nuova sottocategoria */
  parentId: number | null;
}

function CategoryForm({
  target,
  tree,
  onDone,
}: {
  target: FormTarget;
  tree: ServiceCategory[];
  onDone: () => void;
}) {
  const save = useSaveServiceCategory();
  const { category } = target;
  const hasChildren = (category?.children.length ?? 0) > 0;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      parentId: String(category?.parent_id ?? target.parentId ?? ""),
    },
  });

  // Solo le categorie principali possono fare da "padre" (massimo due livelli).
  const parents = tree.filter((c) => c.id !== category?.id);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({
        id: category?.id,
        name: values.name,
        parent_id: values.parentId ? Number(values.parentId) : null,
      });
      toast.success(category ? "Categoria aggiornata" : "Categoria creata");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, { parent_id: "parentId" })) toast.error(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Nome" htmlFor="cat-name" error={errors.name?.message}>
        <Input id="cat-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field
        label="Si trova dentro"
        htmlFor="cat-parent"
        error={errors.parentId?.message}
        hint={
          hasChildren
            ? "Questa categoria ha sottocategorie: resta una categoria principale."
            : "Lascia “Nessuna” per una categoria principale, oppure scegli dove inserire la sottocategoria."
        }
      >
        <NativeSelect id="cat-parent" disabled={hasChildren} aria-invalid={!!errors.parentId} {...register("parentId")}>
          <option value="">Nessuna (categoria principale)</option>
          {parents.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending ? "Salvataggio…" : "Salva"}
      </Button>
    </form>
  );
}

function RowActions({
  label,
  onEdit,
  onDelete,
  onAddChild,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center">
      {onAddChild ? (
        <Button variant="ghost" size="icon" aria-label={`Aggiungi sottocategoria a ${label}`} onClick={onAddChild}>
          <FolderPlusIcon />
        </Button>
      ) : null}
      <Button variant="ghost" size="icon" aria-label={`Modifica ${label}`} onClick={onEdit}>
        <PencilIcon />
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Elimina ${label}`} className="text-destructive" onClick={onDelete}>
        <Trash2Icon />
      </Button>
    </div>
  );
}

export default function ServiceCategoriesPage() {
  const { data, isLoading, isError, refetch } = useServiceCategories();
  const tree = useMemo(() => data ?? [], [data]);
  const del = useDeleteServiceCategory();

  const [target, setTarget] = useState<FormTarget | null>(null);
  const [toDelete, setToDelete] = useState<ServiceCategory | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Categoria eliminata");
      setToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Impossibile eliminare la categoria."));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/services"
        className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 mb-1 gap-1.5 text-muted-foreground")}
      >
        <ArrowLeftIcon /> Servizi
      </Link>
      <PageHeader
        title="Categorie"
        description="Organizza i servizi in categorie e sottocategorie"
        actions={
          <Button onClick={() => setTarget({ category: null, parentId: null })}>
            <PlusIcon /> Nuova
          </Button>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : tree.length === 0 ? (
        <EmptyState
          icon={FolderTreeIcon}
          title="Nessuna categoria"
          description="Crea una categoria (es. Estetica) e le sue sottocategorie (es. Viso, Corpo)."
          action={<Button onClick={() => setTarget({ category: null, parentId: null })}>Aggiungi categoria</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {tree.map((c) => (
            <li key={c.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center gap-2 p-3">
                <FolderTreeIcon className="size-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.services.length} {c.services.length === 1 ? "servizio" : "servizi"}
                    {c.children.length > 0 ? ` · ${c.children.length} sottocategorie` : ""}
                  </p>
                </div>
                <RowActions
                  label={c.name}
                  onAddChild={() => setTarget({ category: null, parentId: c.id })}
                  onEdit={() => setTarget({ category: c, parentId: null })}
                  onDelete={() => setToDelete(c)}
                />
              </div>
              {c.children.length > 0 ? (
                <ul className="divide-y border-t bg-muted/30">
                  {c.children.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 py-1 pr-3 pl-6">
                      <CornerDownRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.services.length} {s.services.length === 1 ? "servizio" : "servizi"}
                        </p>
                      </div>
                      <RowActions
                        label={`${c.name} > ${s.name}`}
                        onEdit={() => setTarget({ category: s, parentId: null })}
                        onDelete={() => setToDelete(s)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ResponsiveDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={target?.category ? "Modifica categoria" : target?.parentId ? "Nuova sottocategoria" : "Nuova categoria"}
        className="sm:max-w-sm"
      >
        {target ? (
          <CategoryForm
            key={target.category?.id ?? `new-${target.parentId ?? "root"}`}
            target={target}
            tree={tree}
            onDone={() => setTarget(null)}
          />
        ) : null}
      </ResponsiveDialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminare la categoria?"
        description={
          toDelete
            ? `“${toDelete.name}” verrà eliminata. I servizi che contiene restano, ma senza categoria${
                toDelete.children.length > 0 ? ", e le sue sottocategorie diventano categorie principali" : ""
              }.`
            : undefined
        }
        loading={del.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
