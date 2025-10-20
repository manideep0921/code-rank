import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function safeSet(k, v) { try { localStorage.setItem(k, v); } catch {} }

function strength(pw = "") {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 5);
}
const LABELS = ["Too short", "Weak", "Okay", "Good", "Strong"];

export default function SignUp() {
  const n = useNavigate();
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const s = strength(pw);
  const pct = Math.round((s / 5) * 100);

  async function onSubmit() {
    if (loading) return;
    setLoading(true);
    setErr(""); setOk("");
    try {
      const r = await api.post("/auth/register", { username, email, password: pw });
      const { token, user } = r.data || {};
      if (!token || !user) throw new Error("Invalid response");
      safeSet("token", token);
      safeSet("me", JSON.stringify(user));
      setOk("Account created! Redirecting…");
      setTimeout(() => n("/dashboard"), 400);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Sign up failed. Try a different email/username."
      );
    } finally {
      setLoading(false);
    }
  }

  const disabled = !username || !email || pw.length < 6 || loading;

  return (
    <div className="relative min-h-[calc(100vh-56px)] grid place-items-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 70% 30%, rgba(59,130,246,.25), transparent 60%), radial-gradient(50% 50% at 30% 70%, rgba(34,197,94,.18), transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative w-full max-w-4xl grid md:grid-cols-[1.2fr_1fr] gap-6 px-6">
        {/* Left: mini benefits */}
        <div className="hidden md:flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <div className="text-2xl font-semibold text-white">Create Account</div>
            <div className="text-zinc-400 mt-1">Join thousands leveling up daily.</div>
          </div>

          <ul className="mt-6 grid gap-2 text-sm">
            {[
              "Earn XP and unlock badges",
              "Climb the leaderboard",
              "Clean editor + safe sandboxes",
              "Track streaks and progress",
            ].map((t) => (
              <li
                key={t}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-300">{t}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-3 gap-2 mt-6">
            {["Python", "JavaScript", "C++"].map((t) => (
              <div key={t} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center text-sm text-zinc-300">
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur p-5 shadow-[0_0_0_1px_rgba(255,255,255,.04)]">
          <div className="text-white font-semibold text-lg">Create Account</div>

          {err ? (
            <div className="mt-3 text-sm rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 px-3 py-2">
              {err}
            </div>
          ) : null}
          {ok ? (
            <div className="mt-3 text-sm rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-3 py-2">
              {ok}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <input
              value={username}
              onChange={(e) => setU(e.target.value)}
              placeholder="Username"
              className="w-full rounded-md bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setE(e.target.value)}
              placeholder="Email"
              className="w-full rounded-md bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
            />
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Password"
                className="w-full rounded-md bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500 pr-14"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10"
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>

            {/* strength meter */}
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all ${pct < 40 ? "bg-rose-500" : pct < 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-500">
                Password strength: <span className="text-zinc-300">{LABELS[Math.max(0, s - 1)] || "Too short"}</span>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={disabled}
              className="w-full rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-60 px-3 py-2 text-sm font-medium text-white transition"
            >
              {loading ? "Creating…" : "Sign Up"}
            </button>
          </div>

          <div className="mt-3 text-[12px] text-zinc-500">
            Already have an account?{" "}
            <Link to="/signin" className="text-violet-300 hover:text-violet-200">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
