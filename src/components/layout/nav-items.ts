import {
  CalendarDaysIcon,
  ClipboardListIcon,
  ScissorsIcon,
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Calendario", icon: CalendarDaysIcon },
  { href: "/appointments", label: "Appuntamenti", icon: ClipboardListIcon },
  { href: "/clients", label: "Clienti", icon: UsersIcon },
  { href: "/services", label: "Servizi", icon: ScissorsIcon },
  { href: "/staff", label: "Staff", icon: UserRoundIcon },
];

/** Voci mostrate nella barra in basso su mobile; le altre stanno sotto "Altro". */
export const MOBILE_PRIMARY = ["/", "/appointments", "/clients"];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
