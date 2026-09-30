"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOutIcon } from "lucide-react";
import { logout } from "@/api/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AppointmentFormDialog } from "@/components/appointments/appointment-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { MOBILE_PRIMARY, NAV_ITEMS, isActive } from "@/components/layout/nav-items";

function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  return async () => {
    try {
      await logout();
    } catch {
      // il token è già stato cancellato localmente
    }
    qc.clear();
    toast.success("Sei uscita dall'account");
    router.replace("/login");
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const doLogout = useLogout();
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const secondary = NAV_ITEMS.filter((i) => !MOBILE_PRIMARY.includes(i.href));
  const moreActive = secondary.some((i) => isActive(pathname, i.href));

  return (
    <div className="flex min-h-dvh">
      <Sidebar onLogout={() => setLogoutOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <header className="pt-safe sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-1.5 backdrop-blur md:hidden">
          <Link href="/" aria-label="Home">
            <BrandLogo className="h-10" priority />
          </Link>
          <div className="flex items-center">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Esci" onClick={() => setLogoutOpen(true)}>
              <LogOutIcon className="size-5" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-4 pb-32 md:px-6 md:pt-6 md:pb-10">{children}</main>
      </div>

      <BottomNav moreActive={moreActive} onMore={() => setMoreOpen(true)} onNew={() => setNewOpen(true)} />

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="pb-safe rounded-t-2xl p-4">
          <SheetTitle className="sr-only">Altro</SheetTitle>
          <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-muted" />
          <div className="flex flex-col gap-1">
            {secondary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-lg px-3 text-base font-medium",
                  isActive(pathname, item.href) ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Vuoi uscire?"
        description="Dovrai accedere di nuovo per usare l'app."
        confirmLabel="Esci"
        onConfirm={() => {
          setLogoutOpen(false);
          doLogout();
        }}
      />

      <AppointmentFormDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
