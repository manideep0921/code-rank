// src/components/ThemeToggle.jsx
import React, { useEffect, useState } from "react";
import { getTheme, toggleTheme } from "../lib/theme";

export default function ThemeToggle({ className = "" }) {
  const [mode, setMode] = useState(getTheme());

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      // Only auto-switch if user never chose explicitly
      if (!localStorage.getItem("theme")) {
        const next = mql.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        if (next === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        setMode(next);
      }
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const isDark = mode === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => {
        toggleTheme();
        setMode(getTheme());
      }}
      className={
        "rounded-lg px-2 py-1 text-lg ring-1 ring-white/10 hover:bg-white/5 " +
        className
      }
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
