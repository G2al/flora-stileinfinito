"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeftIcon, PencilIcon, PhoneIcon, UsersIcon } from "lucide-react";
import { useClient, useDeleteClient } from "@/api/clients";
import { getErrorMessage } from "@/lib/api";
import { clientFullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ClientForm } from "@/components/clients/client-form";
import { ClientSummaryView } from "@/components/clients/client-summary-view";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/shared/page-parts";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

export default function ClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;

  const { data: client, isLoading, isError, error, refetch } = useClient(validId ? id : 0);
  const del = useDeleteClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const notFound = !validId || (axios.isAxiosError(error) && error.response?.status === 404);

  async function confirmDelete() {
    try {
      await del.mutateAsync(id);
      toast.success("Cliente eliminata");
      router.replace("/clients");
    } catch (e) {
      toast.error(getErrorMessage(e, "Impossibile eliminare la cliente."));
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/clients" className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 mb-1 gap-1.5 text-muted-foreground")}>
        <ArrowLeftIcon /> Clienti
      </Link>

      {notFound ? (
        <EmptyState icon={UsersIcon} title="Cliente non trovata" description="Potrebbe essere stata eliminata." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !client ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-40" />
        </div>
      ) : (
        <>
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{clientFullName(client)}</h1>
              <a
                href={`tel:${client.phone.replace(/\s+/g, "")}`}
                className="mt-0.5 inline-flex min-h-9 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <PhoneIcon className="size-3.5" /> {client.phone}
              </a>
              {client.notes ? <p className="mt-1 max-w-prose text-sm whitespace-pre-line">{client.notes}</p> : null}
            </div>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <PencilIcon /> Modifica
            </Button>
          </header>

          <ClientSummaryView clientId={client.id} />

          <ResponsiveDialog open={editOpen} onOpenChange={setEditOpen} title="Modifica cliente">
            {editOpen ? (
              <ClientForm
                client={client}
                onDone={() => setEditOpen(false)}
                onDelete={() => {
                  setEditOpen(false);
                  setDeleteOpen(true);
                }}
              />
            ) : null}
          </ResponsiveDialog>

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Eliminare la cliente?"
            description={`${clientFullName(client)} verrà eliminata insieme a tutti i suoi appuntamenti. L'azione non si può annullare.`}
            loading={del.isPending}
            onConfirm={confirmDelete}
          />
        </>
      )}
    </div>
  );
}
