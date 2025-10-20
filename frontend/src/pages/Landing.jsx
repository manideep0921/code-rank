// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-zinc-900/40 ring-1 ring-white/5">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-zinc-400 text-sm">{label}</div>
      {hint ? <div className="text-emerald-400/80 text-xs mt-1">{hint}</div> : null}
    </div>
  );
}

const LANG_SNIPPETS = {
  python: `print("Hello, CodeRank!")\nprint(sum([1, 2, 3]))`,
  javascript: `console.log("Hello, CodeRank!");\nconsole.log([1,2,3].reduce((a,b)=>a+b,0));`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){cout<<"Hello, CodeRank!\\n"<<(1+2+3)<<endl;}`,
};

export default function Home() {
  const navigate = useNavigate();

  /* ---------- stats ---------- */
  const [stats, setStats] = useState({
    problems: "—",
    users: "—",
    todaySubs: "—",
  });

  useEffect(() => {
    (async () => {
      try {
        const [problemsRes, lbRes] = await Promise.allSettled([
          api.get("/problems"),
          api.get("/leaderboard"),
        ]);

        const problemsCount =
          problemsRes.status === "fulfilled" ? problemsRes.value.data.length : "—";
        const usersCount =
          lbRes.status === "fulfilled" ? lbRes.value.data.length : "—";
        // Optional: submissions today endpoint if you add later
        setStats((s) => ({
          ...s,
          problems: problemsCount,
          users: usersCount,
          todaySubs: "↑ live",
        }));
      } catch {}
    })();
  }, []);

  /* ---------- quotes carousel ---------- */
  const quotes = useMemo(
    () => [
      { q: "First, solve the problem. Then, write the code.", a: "John Johnson" },
      { q: "Code is like humor. When you have to explain it, it’s bad.", a: "Cory House" },
      { q: "Practice makes progress, not perfect.", a: "Unknown" },
      { q: "Programs must be written for people to read.", a: "SICP" },
    ],
    []
  );
  const [qIdx, setQIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setQIdx((i) => (i + 1) % quotes.length), 3800);
    return () => clearInterval(t);
  }, [quotes.length]);

  /* ---------- mini playground ---------- */
  const [lang, setLang] = useState("python");
  const [code, setCode] = useState(LANG_SNIPPETS.python);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const runRef = useRef(false);

  useEffect(() => {
    setCode(LANG_SNIPPETS[lang]);
    setOut("");
  }, [lang]);

  async function runSnippet() {
    if (runRef.current) return;
    setLoading(true);
    runRef.current = true;
    try {
      const r = await api.post("/run", { language: lang, code });
      const { stdout, stderr, exitCode } = r.data || {};
      setOut(
        [stdout || "", stderr ? `\n[stderr]\n${stderr}` : "", `\n(exit ${exitCode})`]
          .join("")
          .trim()
      );
    } catch (e) {
      setOut("Failed to run demo. Check backend /api/run.");
    } finally {
      setLoading(false);
      runRef.current = false;
    }
  }

  /* ---------- auth CTA ---------- */
  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("me") || "null");
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-black text-zinc-200">
      {/* Soft radial glow */}
      <div
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_60%)]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 30%, rgba(168,85,247,.3), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(59,130,246,.25), transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* HERO */}
      <section className="relative pt-20 pb-14">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Practice • Earn XP • Level up
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
              CodeRank
            </span>
          </h1>

          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            Sharpen your problem-solving skills, climb the leaderboard, and collect badges.
            It’s practice—gameified.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/problems"
              className="rounded-xl px-5 py-3 font-medium text-white bg-violet-600 hover:bg-violet-500 transition"
            >
              Start Coding
            </Link>

            <button
              onClick={() => (me ? navigate("/dashboard") : navigate("/auth/signin"))}
              className="rounded-xl px-5 py-3 font-medium text-zinc-200 ring-1 ring-white/15 hover:bg-white/5 transition"
            >
              {me ? "Go to Dashboard" : "Sign in to Save Progress"}
            </button>
          </div>

          {/* Stats strip */}
          <div className="mt-10 grid grid-cols-3 max-sm:grid-cols-1 gap-3 sm:gap-4">
            <Stat label="Problems" value={stats.problems} hint="+ new weekly" />
            <Stat label="Top Coders" value={stats.users} hint="live leaderboard" />
            <Stat label="Submissions" value={stats.todaySubs} hint="today" />
          </div>
        </div>
      </section>

      {/* FEATURES + MINI PLAYGROUND */}
      <section className="relative py-8">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-8">
          {/* Left: features */}
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold text-white">Why CodeRank?</h2>
            <ul className="grid gap-4">
              {[
                {
                  t: "Earn XP & Level Up",
                  d: "Every accepted solution rewards XP. Hit milestones to level up and unlock badges.",
                },
                {
                  t: "Hand-picked Problems",
                  d: "A crisp ladder of easy → medium → hard that builds core interview muscle.",
                },
                {
                  t: "Safe Sandboxes",
                  d: "Run code in isolated containers for Python, JS, C++, and Java.",
                },
                {
                  t: "Clean, Fast UI",
                  d: "Dark, distraction-free surface with keyboard-first navigation.",
                },
              ].map((f) => (
                <li
                  key={f.t}
                  className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-white font-medium">{f.t}</div>
                      <div className="text-zinc-400 text-sm mt-1">{f.d}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Rotating quote */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4">
              <div className="text-zinc-300 italic transition-opacity duration-700 ease-in-out">
                “{quotes[qIdx].q}”
              </div>
              <div className="text-zinc-500 text-sm mt-1">— {quotes[qIdx].a}</div>
            </div>
          </div>

          {/* Right: mini playground */}
          <div className="rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur p-4 md:p-5 ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {Object.keys(LANG_SNIPPETS).map((k) => (
                  <button
                    key={k}
                    onClick={() => setLang(k)}
                    className={
                      "px-3 py-1.5 rounded-lg text-sm transition " +
                      (lang === k
                        ? "bg-white/10 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-white/5")
                    }
                  >
                    {k}
                  </button>
                ))}
              </div>
              <button
                onClick={runSnippet}
                disabled={loading}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-3 py-1.5 text-sm font-medium text-white transition"
              >
                {loading ? "Running…" : "Run demo"}
              </button>
            </div>

            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="h-56 w-full resize-none rounded-lg bg-zinc-900/70 p-3 font-mono text-sm text-zinc-100 ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
              />

              <pre className="h-56 overflow-auto rounded-lg bg-black/70 p-3 font-mono text-sm text-zinc-200 ring-1 ring-white/10">
                {out || "/* Output appears here */"}
              </pre>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Demo runs in a sandbox via <code className="text-zinc-300">/api/run</code>
              . Try editing and run again.
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-2xl bg-gradient-to-r from-violet-600/30 via-fuchsia-500/25 to-amber-400/25 p-1">
            <div className="rounded-2xl bg-zinc-950/70 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <div className="text-xl md:text-2xl font-semibold text-white">
                  Ready to climb?
                </div>
                <div className="text-zinc-400">
                  Pick a problem, submit a solution, earn XP. Repeat.
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/problems"
                  className="rounded-xl px-5 py-3 font-medium text-white bg-violet-600 hover:bg-violet-500 transition"
                >
                  Browse Problems
                </Link>
                <Link
                  to="/leaderboard"
                  className="rounded-xl px-5 py-3 font-medium text-zinc-200 ring-1 ring-white/15 hover:bg-white/5 transition"
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* subtle bottom gradient */}
      <div
        className="pointer-events-none absolute -bottom-40 left-0 right-0 h-80"
        style={{
          background:
            "radial-gradient(50% 80% at 50% 20%, rgba(147,51,234,.25), transparent 70%)",
          filter: "blur(20px)",
        }}
      />
    </div>
  );
}
