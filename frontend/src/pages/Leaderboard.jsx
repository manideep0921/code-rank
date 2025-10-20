// src/pages/Leaderboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

/* ---------------- helpers ---------------- */
function useMe() {
  try {
    return JSON.parse(localStorage.getItem("me") || "null");
  } catch {
    return null;
  }
}

const MEDALS = ["🥇", "🥈", "🥉"];

function initials(name = "") {
  const parts = String(name).trim().split(/\s+|_/).filter(Boolean);
  const s =
    (parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] || "" : "");
  return s.toUpperCase() || "U";
}

function avatarBg(key = "") {
  // stable pastel based on username
  const palette = [
    "from-violet-500/40 to-fuchsia-500/30",
    "from-sky-500/40 to-indigo-500/30",
    "from-emerald-500/40 to-teal-500/30",
    "from-rose-500/40 to-amber-500/30",
    "from-blue-500/40 to-cyan-500/30",
  ];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) % palette.length;
  return palette[h];
}

/* --------------- row component --------------- */
function Row({ rank, user, highlight, maxXP }) {
  const pct = Math.max(0, Math.min(100, Math.round(((user.xp || 0) / (maxXP || 1)) * 100)));

  return (
    <div
      className={
        "grid grid-cols-[60px_1fr_120px_180px_120px] gap-3 px-4 py-3 items-center rounded-xl " +
        "border transition " +
        (highlight
          ? "border-violet-400/40 bg-violet-500/10 shadow-[0_0_0_1px_rgba(168,85,247,.15)]"
          : "border-white/10 hover:border-white/20 bg-white/[0.04]")
      }
    >
      <div className="text-center text-zinc-300 font-medium">
        {rank <= 3 ? (
          <span className="text-lg align-middle">{MEDALS[rank - 1]}</span>
        ) : (
          <span className="text-zinc-400">{rank}</span>
        )}
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div
          className={
            "h-9 w-9 rounded-full bg-gradient-to-br " +
            avatarBg(user.username || user.full_name || "")
          }
        >
          <div className="h-full w-full grid place-items-center text-[11px] text-white/90 font-semibold">
            {initials(user.username || user.full_name)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-white">{user.username || "user"}</div>
          <div className="text-[11px] text-zinc-500 truncate">{user.email || ""}</div>
        </div>
      </div>

      <div className="text-center">
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-indigo-200 bg-indigo-500/10 ring-1 ring-indigo-500/20">
          Lv {user.level ?? "—"}
        </span>
      </div>

      {/* XP progress (relative to top user) */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
            style={{ width: `${pct}%`, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }}
          />
        </div>
        <div className="w-[52px] text-right text-sm text-zinc-200">{user.xp ?? 0}</div>
      </div>

      <div className="text-right">
        {user.id ? (
          <Link
            to={`/profile/${user.id}`}
            className="text-xs rounded-lg px-3 py-1.5 ring-1 ring-white/15 text-zinc-200 hover:bg-white/5 transition"
          >
            View profile
          </Link>
        ) : (
          <span className="text-xs text-zinc-500">—</span>
        )}
      </div>
    </div>
  );
}

/* --------------- page --------------- */
export default function Leaderboard() {
  const me = useMe();

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  // controls
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("rank"); // rank | xp | level | name
  const [topN, setTopN] = useState(50); // 10 | 50 | 100 | all
  const [showMe, setShowMe] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.get("/leaderboard");
        const arr = Array.isArray(r.data) ? r.data : [];
        // Normalize
        const normalized = arr.map((u) => ({
          id: u.id ?? u.user_id,
          username: u.username,
          email: u.email,
          xp: Number(u.xp ?? 0),
          level: Number(u.level ?? 1),
        }));
        setRaw(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // compute rank by XP desc, then level desc, then name
  const ranked = useMemo(() => {
    const arr = [...raw].sort((a, b) => {
      if ((b.xp || 0) !== (a.xp || 0)) return (b.xp || 0) - (a.xp || 0);
      if ((b.level || 0) !== (a.level || 0)) return (b.level || 0) - (a.level || 0);
      return String(a.username || "").localeCompare(String(b.username || ""));
    });
    return arr.map((u, i) => ({ ...u, _rank: i + 1 }));
  }, [raw]);

  const maxXP = useMemo(() => Math.max(1, ...ranked.map((u) => u.xp || 0)), [ranked]);

  const filtered = useMemo(() => {
    let arr = ranked;

    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (u) =>
          String(u.username || "").toLowerCase().includes(s) ||
          String(u.email || "").toLowerCase().includes(s)
      );
    }

    if (sort === "xp") arr = [...arr].sort((a, b) => (b.xp || 0) - (a.xp || 0));
    else if (sort === "level") arr = [...arr].sort((a, b) => (b.level || 0) - (a.level || 0));
    else if (sort === "name")
      arr = [...arr].sort((a, b) =>
        String(a.username || "").localeCompare(String(b.username || ""))
      );
    // default "rank" keeps computed order

    if (topN !== "all") arr = arr.slice(0, Number(topN) || 50);

    // Ensure "me" is visible by appending if hidden
    if (showMe && me?.id) {
      const meIdx = arr.findIndex((u) => u.id === me.id);
      if (meIdx === -1) {
        const inFull = ranked.find((u) => u.id === me.id);
        if (inFull) arr = [...arr, { ...inFull, _pinned: true }];
      }
    }

    return arr;
  }, [ranked, q, sort, topN, showMe, me?.id]);

  return (
    <div className="px-5 md:px-8 lg:px-10 py-6 text-zinc-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Leaderboard</h1>

          <div className="hidden md:flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).catch(() => {});
              }}
              className="text-xs rounded-lg px-3 py-1.5 ring-1 ring-white/15 hover:bg-white/5 transition"
              title="Copy share link"
            >
              Share
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="sticky top-[56px] z-10 mt-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur p-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search user…"
                className="w-56 md:w-80 rounded-lg bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
              >
                <option value="rank">Sort: Rank</option>
                <option value="xp">Sort: XP</option>
                <option value="level">Sort: Level</option>
                <option value="name">Sort: Name</option>
              </select>
              <select
                value={topN}
                onChange={(e) => setTopN(e.target.value)}
                className="rounded-lg bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
              >
                <option value={10}>Top 10</option>
                <option value={50}>Top 50</option>
                <option value={100}>Top 100</option>
                <option value="all">All</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={showMe}
                onChange={(e) => setShowMe(e.target.checked)}
                className="accent-violet-500"
              />
              Always show my rank
            </label>
          </div>
        </div>

        {/* Header row */}
        <div className="mt-4 grid grid-cols-[60px_1fr_120px_180px_120px] gap-3 px-4 py-2 text-sm text-zinc-400">
          <div className="text-center">#</div>
          <div>User</div>
          <div className="text-center">Level</div>
          <div>XP</div>
          <div className="text-right">Action</div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[64px] rounded-xl border border-white/10 bg-zinc-900/40 animate-pulse"
              />
            ))
          ) : filtered.length ? (
            filtered.map((u) => (
              <Row
                key={`${u.id || u.username}-${u._rank}`}
                rank={u._rank}
                user={u}
                maxXP={maxXP}
                highlight={me?.id && u.id === me.id}
              />
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
              No users found.
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="mt-4 text-xs text-zinc-500">
          XP bar is relative to the top player on this board.
        </div>
      </div>
    </div>
  );
}
