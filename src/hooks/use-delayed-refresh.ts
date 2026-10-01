import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DELAYED_REFRESH_EVENT, DELAYED_REFRESH_MS } from "@/lib/delayed-refresh";

/**
 * Da montare una sola volta in un componente che resta sempre vivo (la shell): ascolta le richieste
 * di refetch ritardato e ne esegue UNO (niente polling). Il timer viene cancellato allo smontaggio.
 */
export function useDelayedAppointmentsRefresh() {
  const qc = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onRequest = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["appointments"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }, DELAYED_REFRESH_MS);
    };
    window.addEventListener(DELAYED_REFRESH_EVENT, onRequest);
    return () => {
      window.removeEventListener(DELAYED_REFRESH_EVENT, onRequest);
      clearTimeout(timer);
    };
  }, [qc]);
}
