// frontend/src/lib/auth.js
import { api } from "./api";

const KEY_TOKEN = "token";
const KEY_USER  = "me";

/* ---------- LocalStorage helpers ---------- */
export function saveToken(t) {
  localStorage.setItem(KEY_TOKEN, t);
}
export function getToken() {
  return localStorage.getItem(KEY_TOKEN) || "";
}

export function saveUser(u) {
  localStorage.setItem(KEY_USER, JSON.stringify(u || {}));
}
export function getUser() {
  try {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isAuthed() {
  return !!getToken();
}
export function logout() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);
}

/**
 * getMe(token?)
 * - If `token` is provided (fresh after signin), use it once by passing it in headers.
 * - Otherwise, relies on axios interceptor to attach the stored token automatically.
 * - Caches the fetched user into localStorage under "me".
 * - Falls back to common endpoints if /auth/me isn’t available.
 */
export async function getMe(token) {
  const cached = getUser();
  if (cached && Object.keys(cached).length) return cached;

  const cfg = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

  // Preferred endpoint
  try {
    const res = await api.get("/auth/me", cfg);
    const me = res?.data;
    if (me && typeof me === "object") {
      saveUser(me);
      return me;
    }
  } catch { /* continue to fallbacks */ }

  // Fallbacks (no /api prefix here; axios baseURL already ends with /api)
  for (const ep of ["/user/me", "/me"]) {
    try {
      const res = await api.get(ep, cfg);
      const me = res?.data;
      if (me && typeof me === "object") {
        saveUser(me);
        return me;
      }
    } catch { /* try next */ }
  }

  return {};
}
