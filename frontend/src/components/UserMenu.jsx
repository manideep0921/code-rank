// src/components/UserMenu.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toggleTheme, getTheme, setTheme } from "../lib/theme"; // from earlier theme setup

const LEVEL_XP = 100;

function useMe() {
  try {
    return JSON.parse(localStorage.getItem("me") || "null");
  } catch {
    return null;
  }
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+|_/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase() || "U";
}

export default function UserMenu() {
  const me = useMe();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(getTheme());
  const ref = useRef(null);

  // Close on outside click / Esc
  useEffect(() => {
    function onDoc(e) {
      if (open && ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Hotkeys: g d (dashboard), g p (problems), t (theme)
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey) return;
      if (e.key.toLowerCase() === "t") {
        toggleTheme();
        setMode(getTheme());
      }
      if (e.key.toLowerCase() === "g") {
        let chain = "";
        const handler = (ev) => {
          chain = (chain + ev.key.toLowerCase()).slice(-1);
          if (chain === "d") nav("/dashboard");
          if (chain === "p") nav("/problems");
          window.removeEventListener("keydown", handler, true);
        };
        window.addEventListener("keydown", handler, true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav]);

  if (!me) {
    return (
      <Link
        to="/signin"
        className="rounded-lg px-3 py-1.5 ring-1 ring-white/15 text-zinc-200 hover:bg-white/5"
      >
        Sign in
      </Link>
    );
  }

  const xp = Number(me.xp ?? 0);
  const level = Number(me.level ?? 1);
  const xpInLevel = xp % LEVEL_XP;
  const pct = Math.max(0, Math.min(100, Math.round((xpInLevel / LEVEL_XP) * 100)));

  function signOut() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("me");
    } catch {}
    nav("/signin");
  }

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button with progress ring */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-full bg-zinc-800 ring-1 ring-white/10 grid place-items-center text-[11px] text-white/90 font-semibold"
        aria-label="Open user menu"
      >
        {/* progress ring */}
        <svg className="absolute inset-0" viewBox="0 0 36 36" aria-hidden>
          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 100} 100`}
            pathLength="100"
            transform="rotate(-90 18 18)"
          />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="relative">{initials(me.username || me.full_name || "")}</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-black/80 backdrop-blur shadow-xl overflow-hidden"
          role="menu"
        >
          {/* header */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-zinc-400">
                  Level {level} • {xp} XP
                </div>
                <div className="text-white font-medium truncate">{me.username}</div>
                <div className="text-[11px] text-zinc-500 truncate">{me.email}</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/25">
                {pct}% to L{level + 1}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* actions */}
          <div className="p-1">
            <MenuItem to={`/profile/${me.id}`} label="Profile" k="P" />
            <MenuItem to="/dashboard" label="Dashboard" k="D" />
            <MenuItem to="/problems" label="Problems" k="G P" />
            <MenuItem to="/leaderboard" label="Leaderboard" />
            <Divider />
            <button
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between"
              onClick={() => {
                const t = mode === "dark" ? "light" : "dark";
                setTheme(t);
                setMode(t);
              }}
            >
              <span className="text-zinc-200">Theme</span>
              <span className="text-zinc-400 text-xs">{mode === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between"
              onClick={() => {
                navigator.clipboard?.writeText(String(me.id)).catch(() => {});
              }}
              title="Copy your user id"
            >
              <span className="text-zinc-200">Copy User ID</span>
              <span className="text-zinc-400 text-xs">#{me.id}</span>
            </button>
            <Divider />
            <MenuItem to="/about" label="About" />
            <MenuItem to="/help" label="Help" />
          </div>

          {/* footer */}
          <div className="px-3 py-2 border-t border-white/10">
            <button
              onClick={signOut}
              className="w-full text-left px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ to, label, k }) {
  if (!to) return null;
  return (
    <Link to={to} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5" role="menuitem">
      <span className="text-zinc-200">{label}</span>
      {k ? <span className="text-zinc-500 text-xs">{k}</span> : null}
    </Link>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-white/10" />;
}
