import { api } from "@/lib/api";
import { tokenStore } from "@/lib/auth-token";
import type { User } from "@/types";

export async function login(email: string, password: string, remember = true) {
  const { data } = await api.post<{ token: string; user: User }>("/login", { email, password });
  tokenStore.set(data.token, remember);
  return data.user;
}

export async function fetchMe() {
  const { data } = await api.get<{ user: User }>("/me");
  return data.user;
}

export async function logout() {
  try {
    await api.post("/logout");
  } finally {
    tokenStore.clear();
  }
}
