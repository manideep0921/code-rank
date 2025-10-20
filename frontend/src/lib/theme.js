const KEY_THEME = "theme"; // "light" | "dark"

/** Read current theme (localStorage first, then system preference). */
export function getTheme() {
  const stored = localStorage.getItem(KEY_THEME);
  if (stored === "dark" || stored === "light") return stored;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

/** Explicitly set a theme ("dark" | "light"). */
export function setTheme(next) {
  const val = next === "dark" ? "dark" : "light";
  localStorage.setItem(KEY_THEME, val);
  document.documentElement.classList.toggle("dark", val === "dark");
  return val;
}

/** Toggle theme and return the new value. */
export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  return setTheme(next);
}

/** Ensure DOM reflects current theme on load/HMR. */
(function applyOnLoad(){
  setTheme(getTheme());
})();
