"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOutIcon, MenuIcon } from "lucide-react";
import { logout } from "@/api/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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

  const primary = NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.href));
  const secondary = NAV_ITEMS.filter((i) => !MOBILE_PRIMARY.includes(i.href));
  const moreActive = secondary.some((i) => isActive(pathname, i.href));

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Link href="/" className="mb-6 block px-1">
          <BrandLogo className="h-20" priority />
        </Link>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Navigazione principale">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between border-t pt-3">
          <Button variant="ghost" className="justify-start gap-2 text-muted-foreground" onClick={doLogout}>
            <LogOutIcon className="size-4" /> Esci
          </Button>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <header className="pt-safe sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-1.5 backdrop-blur md:hidden">
          <Link href="/" aria-label="Home">
            <BrandLogo className="h-10" priority />
          </Link>
          <ThemeToggle />
        </header>

        <main className="min-w-0 flex-1 px-4 pt-4 pb-28 md:px-6 md:pt-6 md:pb-10">{children}</main>
      </div>

      {/* Barra in basso mobile */}
      <nav
        id="bottom-nav"
        aria-label="Navigazione principale"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 backdrop-blur md:hidden"
      >
        {primary.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            moreActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <MenuIcon className="size-5" />
          Altro
        </button>
      </nav>

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
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                doLogout();
              }}
              className="flex h-12 items-center gap-3 rounded-lg px-3 text-base font-medium text-destructive hover:bg-muted"
            >
              <LogOutIcon className="size-5" />
              Esci
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
