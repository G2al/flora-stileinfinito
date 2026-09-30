const KEY = "flora_token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(KEY, token);
    } catch {}
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
  },
};
