import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

/* -------------------- helpers -------------------- */
const DIFF_ORDER = { easy: 1, medium: 2, hard: 3 };
const DIFF_STYLES = {
  easy: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20",
  medium: "text-amber-300 bg-amber-500/10 ring-amber-500/20",
  hard: "text-rose-300 bg-rose-500/10 ring-rose-500/20",
};

function diffClass(d) {
  return (
    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 " +
    (DIFF_STYLES[d] || "text-zinc-300 bg-white/5 ring-white/10")
  );
}

function useMe() {
  try {
    return JSON.parse(localStorage.getItem("me") || "null");
  } catch {
    return null;
  }
}

/* -------------------- UI bits -------------------- */

function StatPill({ label, value, hint }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-zinc-900/40 ring-1 ring-white/5 px-4 py-3">
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="text-zinc-400 text-xs">{label}</div>
      {hint ? <div className="text-emerald-400/80 text-[11px] mt-0.5">{hint}</div> : null}
    </div>
  );
}

function ProblemCard({ p, solved }) {
  return (
    <Link
      to={`/problems/${p.slug || p.id}`}
      className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/7.5 hover:border-white/20 transition group"
    >
      <div className="p-4 flex items-start gap-3">
        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-400/80 group-hover:bg-violet-300" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate text-white font-medium">{p.title}</div>
            <span className={diffClass((p.difficulty || "").toLowerCase())}>
              {(p.difficulty || "").charAt(0).toUpperCase() + (p.difficulty || "").slice(1)}
            </span>
            {typeof p.xp === "number" && (
              <span className="text-xs text-zinc-400">• {p.xp} XP</span>
            )}
            {solved && (
              <span className="ml-1 text-[11px] rounded-md px-1.5 py-0.5 bg-emerald-500/15 ring-1 ring-emerald-500/20 text-emerald-300">
                Solved ✓
              </span>
            )}
          </div>
          <div className="text-zinc-500 text-sm mt-1 line-clamp-1">
            Difficulty: {(p.difficulty || "—").toLowerCase()} • Earn XP by solving
          </div>
        </div>
      </div>
    </Link>
  );
}

/* -------------------- main page -------------------- */

export default function Problems() {
  const me = useMe();

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solvedSet, setSolvedSet] = useState(() => new Set());

  // controls
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all"); // all | easy | medium | hard | unsolved | solved
  const [sort, setSort] = useState("title"); // title | xp | difficulty
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  /* ------ fetch problems ------ */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.get("/problems");
        const data = Array.isArray(r.data) ? r.data : [];
        setRaw(
          data
            .map((p) => ({
              ...p,
              difficulty: (p.difficulty || "").toLowerCase(),
              xp: typeof p.xp === "number" ? p.xp : undefined,
            }))
            .sort((a, b) => a.id - b.id)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------ fetch solved for user (accepted submissions) ------ */
  useEffect(() => {
    (async () => {
      if (!me || !me.id) return;
      try {
        const r = await api.get(`/submissions/user/${me.id}?limit=1000`);
        const acc = new Set(
          (r.data || [])
            .filter((s) => String(s.status || "").toLowerCase().includes("accept"))
            .map((s) => s.problem_id)
        );
        setSolvedSet(acc);
      } catch (e) {
        // ignore
      }
    })();
  }, [me?.id]);

  /* ------ stats ------ */
  const stats = useMemo(() => {
    const total = raw.length;
    const byDiff = { easy: 0, medium: 0, hard: 0 };
    raw.forEach((p) => {
      const d = p.difficulty;
      if (byDiff[d] !== undefined) byDiff[d]++;
    });
    const solved = [...solvedSet].length;
    return { total, ...byDiff, solved };
  }, [raw, solvedSet]);

  /* ------ filtered + sorted data ------ */
  const filtered = useMemo(() => {
    let arr = raw;

    if (tab === "easy" || tab === "medium" || tab === "hard") {
      arr = arr.filter((p) => p.difficulty === tab);
    } else if (tab === "solved") {
      arr = arr.filter((p) => solvedSet.has(p.id));
    } else if (tab === "unsolved") {
      arr = arr.filter((p) => !solvedSet.has(p.id));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q)
      );
    }

    if (sort === "title") {
      arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "xp") {
      arr = [...arr].sort((a, b) => (b.xp || 0) - (a.xp || 0));
    } else if (sort === "difficulty") {
      arr = [...arr].sort(
        (a, b) => (DIFF_ORDER[a.difficulty] || 9) - (DIFF_ORDER[b.difficulty] || 9)
      );
    }

    return arr;
  }, [raw, tab, query, sort, solvedSet]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [query, tab, sort]);

  /* -------------------- render -------------------- */
  return (
    <div className="px-5 md:px-8 lg:px-10 py-6 text-zinc-300">
      {/* Header + Stats */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Problems</h1>
          <div className="hidden md:flex gap-3">
            <StatPill label="Total" value={stats.total} />
            <StatPill label="Easy" value={stats.easy} />
            <StatPill label="Medium" value={stats.medium} />
            <StatPill label="Hard" value={stats.hard} />
            {me ? <StatPill label="Solved" value={stats.solved} /> : null}
          </div>
        </div>

        {/* Controls */}
        <div className="sticky top-[56px] z-10 mt-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur p-3">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* left: tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["easy", "Easy"],
                ["medium", "Medium"],
                ["hard", "Hard"],
                ...(me ? [["unsolved", "Unsolved"], ["solved", "Solved"]] : []),
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={
                    "px-3 py-1.5 rounded-lg text-sm transition ring-1 " +
                    (tab === k
                      ? "bg-white/10 text-white ring-white/15"
                      : "text-zinc-400 ring-white/10 hover:bg-white/5 hover:text-white")
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* right: search + sort */}
            <div className="flex gap-2">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search problems..."
                  className="w-64 md:w-80 rounded-lg bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
              >
                <option value="title">Sort: Title</option>
                <option value="xp">Sort: XP</option>
                <option value="difficulty">Sort: Difficulty</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-white/10 bg-zinc-900/40 animate-pulse"
              />
            ))
          ) : pageItems.length ? (
            pageItems.map((p) => (
              <ProblemCard key={p.id} p={p} solved={solvedSet.has(p.id)} />
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
              No problems match your filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-5 flex items-center justify-between text-sm">
          <div className="text-zinc-400">
            Page <span className="text-zinc-200">{page}</span> of{" "}
            <span className="text-zinc-200">{totalPages}</span> •{" "}
            <span className="text-zinc-200">{filtered.length}</span> results
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg ring-1 ring-white/10 disabled:opacity-50 hover:bg-white/5"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg ring-1 ring-white/10 disabled:opacity-50 hover:bg-white/5"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
