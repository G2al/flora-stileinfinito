"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Elimina",
  loading,
  onConfirm,
}: Props) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={title} description={description} className="sm:max-w-sm">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Annulla
        </Button>
        <Button
          className="bg-destructive text-white hover:bg-destructive/90"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Attendi…" : confirmLabel}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
