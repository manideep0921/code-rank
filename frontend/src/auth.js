const TOKEN_KEY = "token";
const USER_KEY = "user";
const THEME_KEY = "theme";

/* ========== AUTH ========== */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user || null));
}
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthed() {
  return Boolean(getToken());
}

export function logout() {
  clearToken();
  localStorage.removeItem(USER_KEY);
}

/* ========== THEME ========== */
// Read saved theme or fall back to system preference
export function getTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function setTheme(theme) {
  const t = theme === "dark" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, t);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", t === "dark");
  }
}

// Apply theme on import (safe no-op in build)
(function applyInitialTheme() {
  if (typeof document !== "undefined") {
    const t = getTheme();
    document.documentElement.classList.toggle("dark", t === "dark");
  }
})();

export default {
  saveToken,
  getToken,
  clearToken,
  saveUser,
  getUser,
  isAuthed,
  logout,
  getTheme,
  setTheme,
};
