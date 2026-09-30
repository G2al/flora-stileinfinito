"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MenuIcon, PlusIcon } from "lucide-react";
import { useDashboard } from "@/api/appointments";
import { cn } from "@/lib/utils";
import { MOBILE_PRIMARY, NAV_ITEMS, isActive, type NavItem } from "@/components/layout/nav-items";

interface Props {
  moreActive: boolean;
  onMore: () => void;
  onNew: () => void;
}

/** Tocco sulla voce già attiva: in cima alla pagina; nel calendario salta a "Oggi". */
function onActiveTap(e: React.MouseEvent, href: string) {
  e.preventDefault();
  if (href === "/") window.dispatchEvent(new Event("calendar:today"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function Tab({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={active ? (e) => onActiveTap(e, item.href) : undefined}
      className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
    >
      <span
        className={cn(
          "relative flex h-7 w-14 items-center justify-center rounded-full transition-colors",
          active ? "bg-primary/12 text-primary" : "text-muted-foreground",
        )}
      >
        <item.icon className="size-5" strokeWidth={active ? 2.5 : 2} />
        {badge ? (
          <span className="absolute top-0 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] leading-none font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className={active ? "text-primary" : "text-muted-foreground"}>{item.label}</span>
    </Link>
  );
}

export function BottomNav({ moreActive, onMore, onNew }: Props) {
  const pathname = usePathname();
  const primary = NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.href));
  const { data } = useDashboard();
  const toSchedule = data?.to_schedule ?? 0;

  // Si nasconde scorrendo verso il basso e riappare verso l'alto (mai nel calendario).
  const [scrolledDown, setScrolledDown] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 40) setScrolledDown(false);
      else if (y - lastY.current > 6) setScrolledDown(true);
      else if (lastY.current - y > 6) setScrolledDown(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const hidden = scrolledDown && pathname !== "/";

  return (
    <nav
      id="bottom-nav"
      aria-label="Navigazione principale"
      style={{ bottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      className={cn(
        "fixed inset-x-3 z-40 grid grid-cols-5 items-center rounded-3xl border bg-background/90 px-1 shadow-lg backdrop-blur-md transition-transform duration-300 md:hidden",
        hidden && "translate-y-[calc(100%+1.5rem+env(safe-area-inset-bottom))]",
      )}
    >
      <Tab item={primary[0]} active={isActive(pathname, primary[0].href)} />
      <Tab item={primary[1]} active={isActive(pathname, primary[1].href)} badge={toSchedule} />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onNew}
          aria-label="Nuovo appuntamento"
          className="-mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95"
        >
          <PlusIcon className="size-7" strokeWidth={2.5} />
        </button>
      </div>

      <Tab item={primary[2]} active={isActive(pathname, primary[2].href)} />
      <button
        type="button"
        onClick={onMore}
        aria-haspopup="dialog"
        className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
      >
        <span
          className={cn(
            "flex h-7 w-14 items-center justify-center rounded-full transition-colors",
            moreActive ? "bg-primary/12 text-primary" : "text-muted-foreground",
          )}
        >
          <MenuIcon className="size-5" strokeWidth={moreActive ? 2.5 : 2} />
        </span>
        <span className={moreActive ? "text-primary" : "text-muted-foreground"}>Altro</span>
      </button>
    </nav>
  );
}
