import axios, { AxiosError } from "axios";
import { tokenStore } from "@/lib/auth-token";
import type { ValidationErrorBody } from "@/types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.includes("/login")) {
      tokenStore.clear();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  },
);

/** Errori di validazione 422: { campo: "messaggio" } */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ValidationErrorBody>(error) && error.response?.status === 422) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(error.response.data.errors ?? {})) {
      out[k] = v[0];
    }
    return out;
  }
  return {};
}

export function getErrorMessage(error: unknown, fallback = "Si è verificato un errore. Riprova."): string {
  if (axios.isAxiosError<ValidationErrorBody>(error)) {
    if (!error.response) return "Impossibile contattare il server. Controlla la connessione.";
    if (error.response.status === 429) return "Troppi tentativi. Riprova tra un minuto.";
    if (error.response.status === 422) {
      const first = Object.values(error.response.data.errors ?? {})[0]?.[0];
      return first ?? error.response.data.message ?? fallback;
    }
    return error.response.data?.message ?? fallback;
  }
  return fallback;
}
