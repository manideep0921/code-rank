// src/components/Navbar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

/* ---------------- helpers ---------------- */
function safeLocalGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/* ---------------- component ---------------- */
export default function Navbar() {
  // Track whether user appears authenticated (based on presence of token)
  const [authed, setAuthed] = useState(() => !!safeLocalGet("token"));

  // Keep auth state in sync across tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "me") {
        setAuthed(!!safeLocalGet("token"));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const baseLink = "text-zinc-300 hover:text-white px-1.5 py-0.5 rounded";
  const activeLink = "text-white bg-zinc-800/60";

  return (
    <nav className="border-b border-zinc-800 px-4 py-3 flex items-center gap-4 bg-zinc-950/70 backdrop-blur">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="CodeRank logo" className="h-6 w-6 object-contain" />
        <span className="font-semibold">CodeRank</span>
      </Link>

      {/* Main nav */}
      <NavLink
        to="/problems"
        className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ""}`}
      >
        Problems
      </NavLink>
      <NavLink
        to="/leaderboard"
        className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ""}`}
      >
        Leaderboard
      </NavLink>
      {authed && (
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ""}`}
        >
          Dashboard
        </NavLink>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <UserMenu /> {/* ✅ new dropdown handles Sign In/Up, avatar, menu, sign out */}
      </div>
    </nav>
  );
}
