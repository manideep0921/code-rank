// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

/* -------------------- tiny helpers -------------------- */
function useMe() {
  try { return JSON.parse(localStorage.getItem("me") || "null"); } catch { return null; }
}
const LEVEL_XP = 100; // simple 0-100 per level ladder

function ProgressBar({ value = 0, max = 100, label }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / (max || 1)) * 100)));
  return (
    <div className="w-full">
      {label ? <div className="mb-1 text-xs text-zinc-400">{label}</div> : null}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
          style={{ width: `${pct}%`, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }}
        />
      </div>
      <div className="mt-1 text-[11px] text-zinc-500">{pct}%</div>
    </div>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${className}`} >
      {children}
    </span>
  );
}

function Badge({ name, icon = "🏆", locked = false }) {
  return (
    <div className={`rounded-lg border p-3 ${locked ? "border-white/10 bg-white/3" : "border-amber-400/30 bg-amber-500/10"}`}>
      <div className="text-xl">{icon}</div>
      <div className={`text-sm mt-1 ${locked ? "text-zinc-400" : "text-amber-200"}`}>{name}</div>
      {locked && <div className="text-[11px] text-zinc-500 mt-0.5">Locked</div>}
    </div>
  );
}

/* -------------------- main page -------------------- */
export default function Dashboard() {
  const me = useMe();
  const nav = useNavigate();

  const [progress, setProgress] = useState({ level: 1, xp: 0 });
  const [badges, setBadges] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters for table
  const [lang, setLang] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    // if logged-out, show skeleton with guest defaults
    if (!me || !me.id) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [p, b, s] = await Promise.all([
          api.get(`/user/${me.id}`),
          api.get(`/userBadges/${me.id}`),
          api.get(`/submissions/user/${me.id}?limit=20`),
        ]);
        setProgress(p.data || { level: 1, xp: 0 });
        setBadges(Array.isArray(b.data) ? b.data : []);
        setRecent(Array.isArray(s.data) ? s.data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [me?.id]);

  /* ---------- computed bits ---------- */
  const xpInLevel = progress?.xp % LEVEL_XP;
  const toNext = LEVEL_XP - xpInLevel;
  const nextLevel = (progress?.level || 1) + 1;

  // streak (very light: consecutive days having a submission)
  const streak = useMemo(() => {
    const dates = [...new Set(recent
      .map(r => r.created_at || r.createdAt)
      .filter(Boolean)
      .map(d => new Date(d).toDateString()))].sort((a,b)=> new Date(b)-new Date(a));
    if (!dates.length) return 0;
    let s = 1;
    for (let i = 1; i < dates.length; i++) {
      const d1 = new Date(dates[i-1]);
      const d2 = new Date(dates[i]);
      const diff = Math.round((d1 - d2) / (1000*60*60*24));
      if (diff === 1) s++;
      else break;
    }
    return s;
  }, [recent]);

  // table filtering
  const languages = useMemo(() => {
    const set = new Set(recent.map(r => (r.language || "").toLowerCase()).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [recent]);

  const filteredRecent = useMemo(() => {
    let arr = recent;
    if (lang !== "all") arr = arr.filter(r => String(r.language || "").toLowerCase() === lang);
    if (status !== "all") {
      const want = status === "accepted" ? "accept" : status;
      arr = arr.filter(r => String(r.status || "").toLowerCase().includes(want));
    }
    return arr;
  }, [recent, lang, status]);

  const lastProblem = useMemo(() => filteredRecent[0]?.problem || filteredRecent[0]?.problem_title, [filteredRecent]);

  /* -------------------- UI -------------------- */
  if (!me || !me.id) {
    return (
      <div className="px-6 md:px-10 py-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl text-white font-semibold">Dashboard</h1>
          <p className="mt-2 text-zinc-400">Sign in to track XP, badges and your submissions.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/auth/signin" className="rounded-xl px-5 py-3 font-medium text-white bg-violet-600 hover:bg-violet-500 transition">Sign In</Link>
            <Link to="/problems" className="rounded-xl px-5 py-3 font-medium text-zinc-200 ring-1 ring-white/15 hover:bg-white/5 transition">Browse Problems</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-8 text-zinc-300">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* -------- left column -------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold">Your Progress</div>
              <Pill className="text-indigo-200 bg-indigo-500/10 ring-indigo-500/20">
                Level {progress?.level ?? 1}
              </Pill>
            </div>
            <div className="mt-3">
              <ProgressBar value={xpInLevel} max={LEVEL_XP} label={`XP in Level • ${xpInLevel} / ${LEVEL_XP}`} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <Pill className="text-emerald-200 bg-emerald-500/10 ring-emerald-500/20">
                +{toNext} XP to reach Level {nextLevel}
              </Pill>
              <Pill className="text-zinc-300 bg-white/5 ring-white/10">
                Total XP: {progress?.xp ?? 0}
              </Pill>
            </div>

            {/* Quick actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/problems" className="rounded-lg px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm transition">Solve a Problem</Link>
              <Link to="/leaderboard" className="rounded-lg px-4 py-2 ring-1 ring-white/15 hover:bg-white/5 text-sm transition">View Leaderboard</Link>
              {lastProblem ? (
                <button
                  onClick={() => nav(`/problems/${filteredRecent[0].problem_slug || filteredRecent[0].problem_id || ""}`)}
                  className="rounded-lg px-4 py-2 ring-1 ring-white/15 hover:bg-white/5 text-sm transition"
                >
                  Resume: {String(lastProblem).slice(0,28)}…
                </button>
              ) : null}
            </div>
          </div>

          {/* Recent submissions */}
          <div className="rounded-2xl border border-white/10 bg-white/5">
            <div className="p-5 flex items-center justify-between">
              <div className="text-white font-semibold">Recent Submissions</div>
              <div className="flex gap-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="rounded-lg bg-zinc-900/70 px-3 py-1.5 text-xs ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
                >
                  {languages.map(l => <option key={l} value={l}>{l === "all" ? "All languages" : l}</option>)}
                </select>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-lg bg-zinc-900/70 px-3 py-1.5 text-xs ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
                >
                  <option value="all">All statuses</option>
                  <option value="accepted">Accepted</option>
                  <option value="wrong">Wrong Answer</option>
                  <option value="time">Time Limit</option>
                  <option value="runtime">Runtime Error</option>
                </select>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="grid grid-cols-[1.3fr_.7fr_.7fr_.9fr] text-xs text-zinc-400 px-3 pb-2">
                <div>Problem</div><div>Language</div><div>Status</div><div>Date</div>
              </div>
              <div className="space-y-2">
                {loading ? (
                  Array.from({length:5}).map((_,i)=>(
                    <div key={i} className="h-12 rounded-lg bg-zinc-900/40 border border-white/10 animate-pulse" />
                  ))
                ) : filteredRecent.length ? (
                  filteredRecent.map((s) => {
                    const ok = String(s.status || "").toLowerCase().includes("accept");
                    return (
                      <div key={s.id}
                        className="grid grid-cols-[1.3fr_.7fr_.7fr_.9fr] items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 hover:border-white/20 transition"
                      >
                        <Link to={`/problems/${s.problem_slug || s.problem_id}`} className="truncate text-white hover:underline">
                          {s.problem_title || s.problem || `#${s.problem_id}`}
                        </Link>
                        <div className="text-sm text-zinc-300">{s.language || "—"}</div>
                        <div>
                          <Pill className={ok ? "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20" : "text-rose-300 bg-rose-500/10 ring-rose-500/20"}>
                            {s.status || (ok ? "Accepted" : "Rejected")}
                          </Pill>
                        </div>
                        <div className="text-sm text-zinc-400">{s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/3 p-6 text-center text-zinc-400">
                    No submissions yet. <Link to="/problems" className="text-violet-300 hover:underline">Pick a problem</Link> and earn your first XP!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* -------- right column -------- */}
        <div className="space-y-6">
          {/* Streak card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold">Daily Streak</div>
              <Pill className="text-emerald-200 bg-emerald-500/10 ring-emerald-500/20">{streak} day{s => s>1 ? "s" : ""}</Pill>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Submit at least once per day to extend your streak. Keep the fire burning!
            </p>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {Array.from({length:7}).map((_,i)=>(
                <div key={i} className={`h-8 rounded-md ${i < streak ? "bg-emerald-500/40" : "bg-white/10"}`} />
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold">Badges</div>
              <Link to="/leaderboard" className="text-xs text-zinc-300 hover:underline">See top players</Link>
            </div>

            {(!badges || badges.length === 0) && (
              <div className="mt-3 text-sm text-zinc-400">No badges yet — solve more to earn them!</div>
            )}

            {badges?.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {badges.map((b)=>(
                  <Badge key={b.id || b.name} name={b.name || "Badge"} icon={b.icon || "🏆"} />
                ))}
              </div>
            )}

            {/* Upcoming milestones (simple XP targets) */}
            <div className="mt-4">
              <div className="text-xs text-zinc-400 mb-2">Next milestones</div>
              <div className="grid grid-cols-1 gap-2">
                {[1,2,3].map((i)=>(
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 px-3 py-2">
                    <div className="text-sm">Level {progress.level + i}</div>
                    <div className="text-xs text-zinc-400">{(i*LEVEL_XP - xpInLevel)} XP to go</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips / CTA */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/20 to-fuchsia-500/10 p-5">
            <div className="text-white font-semibold">Keep climbing</div>
            <p className="text-sm text-zinc-300 mt-1">
              Solve an <span className="text-emerald-300">Easy</span> to warm up, then a{" "}
              <span className="text-amber-300">Medium</span>. Consistency beats intensity.
            </p>
            <div className="mt-3 flex gap-2">
              <Link to="/problems" className="rounded-lg px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm transition">Browse Problems</Link>
              <Link to="/problems?tab=unsolved" className="rounded-lg px-4 py-2 ring-1 ring-white/15 hover:bg-white/5 text-sm transition">Unsolved Only</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
