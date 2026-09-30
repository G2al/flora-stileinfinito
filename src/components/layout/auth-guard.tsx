"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@/lib/auth-token";
import { BrandLogo } from "@/components/layout/brand-logo";

type AuthState = "loading" | "in" | "out";

const subscribe = () => () => {};
const getSnapshot = (): AuthState => (tokenStore.get() ? "in" : "out");
const getServerSnapshot = (): AuthState => "loading";

export function useAuthState(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="animate-pulse">
        <BrandLogo className="h-28" />
      </div>
    </div>
  );
}

/** Protegge le pagine: senza token va a /login, senza mostrare contenuto. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const state = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (state === "out") router.replace("/login");
  }, [state, router]);

  if (state !== "in") return <FullScreenLoader />;
  return <>{children}</>;
}
