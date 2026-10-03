"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, PhoneIcon, PlusIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useClients } from "@/api/clients";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { clientFullName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientForm } from "@/components/clients/client-form";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

export default function ClientsPage() {
  // useSearchParams richiede Suspense nel build statico.
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ClientsContent />
    </Suspense>
  );
}

function ClientsContent() {
  const router = useRouter();
  const [search, setSearch] = useState(useSearchParams().get("q") ?? "");
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search.trim(), 300);
  const { data, isLoading, isError, isFetching, refetch } = useClients({ q, page, per_page: 20 });
  const [formOpen, setFormOpen] = useState(false);

  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Clienti"
        description={meta ? `${meta.total} ${meta.total === 1 ? "cliente" : "clienti"}` : undefined}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon /> Nuova
          </Button>
        }
      />

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cerca per nome, cognome o telefono"
          aria-label="Cerca clienti"
          className="pl-9"
          type="search"
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={q ? "Nessun risultato" : "Nessuna cliente"}
          description={q ? "Prova con un altro nome o numero." : "Aggiungi la prima cliente."}
          action={!q ? <Button onClick={() => setFormOpen(true)}>Aggiungi cliente</Button> : undefined}
        />
      ) : (
        <>
          <ul className={`flex flex-col gap-2 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            {data?.data.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex min-h-16 w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {(c.last_name || c.first_name || c.phone).charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{clientFullName(c)}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <PhoneIcon className="size-3" />
                      {c.phone}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>

          {meta && meta.last_page > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeftIcon /> Precedente
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {meta.current_page} di {meta.last_page}
              </span>
              <Button variant="outline" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Successiva <ChevronRightIcon />
              </Button>
            </div>
          ) : null}
        </>
      )}

      <ResponsiveDialog open={formOpen} onOpenChange={setFormOpen} title="Nuova cliente">
        {formOpen ? (
          <ClientForm
            client={null}
            onDone={(saved) => {
              setFormOpen(false);
              router.push(`/clients/${saved.id}`);
            }}
          />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
