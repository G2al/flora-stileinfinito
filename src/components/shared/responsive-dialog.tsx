"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Larghezza massima in modalità dialog (desktop). */
  className?: string;
}

/** Dialog su desktop, bottom sheet su mobile. */
export function ResponsiveDialog({ open, onOpenChange, title, description, children, className }: Props) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg", className)}>
          <DialogHeader className="p-5 pb-2">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="p-5 pt-3">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] gap-0 overflow-y-auto rounded-t-2xl p-0">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted" />
        <SheetHeader className="p-4 pb-2 pr-14">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="pb-safe px-4 pt-2 pb-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
