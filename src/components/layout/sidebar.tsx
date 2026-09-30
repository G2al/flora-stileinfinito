"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronsLeftIcon, ChevronsRightIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NAV_ITEMS, isActive } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const KEY = "flora_sidebar_collapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Sidebar desktop richiudibile: da chiusa restano solo le icone (con tooltip). */
export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const first = useRef(true);

  function toggle() {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  // Finita l'animazione avvisiamo il calendario, che deve ricalcolare la larghezza.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 260);
    return () => clearTimeout(t);
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r bg-sidebar py-4 transition-[width] duration-200 md:flex",
        collapsed ? "w-[4.5rem] px-2" : "w-60 px-4",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Espandi il menu" : "Comprimi il menu"}
        aria-expanded={!collapsed}
        title={collapsed ? "Espandi il menu" : "Comprimi il menu"}
        className="absolute top-5 -right-3 z-40 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        {collapsed ? <ChevronsRightIcon className="size-3.5" /> : <ChevronsLeftIcon className="size-3.5" />}
      </button>

      <Link href="/" aria-label="Home" className={cn("mb-6 block", collapsed ? "self-center" : "px-1")}>
        {collapsed ? (
          <Image src="/app-icons/icon-192.png" alt="Flora Stile Infinito" width={44} height={44} className="rounded-xl" />
        ) : (
          <BrandLogo className="h-20" priority />
        )}
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Navigazione principale">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "px-3",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {collapsed ? null : <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("flex border-t pt-3", collapsed ? "flex-col items-center gap-1" : "items-center justify-between")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          title={collapsed ? "Esci" : undefined}
          aria-label="Esci"
          className="gap-2 text-muted-foreground"
          onClick={onLogout}
        >
          <LogOutIcon className="size-4" />
          {collapsed ? null : "Esci"}
        </Button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
