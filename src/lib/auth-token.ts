const KEY = "flora_token";

function read(storage: () => Storage): string | null {
  try {
    return storage().getItem(KEY);
  } catch {
    return null;
  }
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return read(() => window.localStorage) ?? read(() => window.sessionStorage);
  },
  /** remember = true: resta dopo la chiusura dell'app (localStorage); false: solo finché l'app è aperta (sessionStorage). */
  set(token: string, remember = true) {
    this.clear();
    try {
      (remember ? window.localStorage : window.sessionStorage).setItem(KEY, token);
    } catch {}
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {}
  },
};
