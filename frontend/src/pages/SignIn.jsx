import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function safeSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
function safeRemove(k) { try { localStorage.removeItem(k); } catch {} }

const TIPS = [
  "Solve one easy a day — consistency beats intensity.",
  "Read editorials after you try—learn new patterns.",
  "Refactor accepted code; clarity wins interviews.",
  "Tag problems you want to revisit—build your ladder.",
];

export default function SignIn() {
  const n = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [caps, setCaps] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 3500);
    return () => clearInterval(t);
  }, []);

  function onKey(e) {
    if (e.getModifierState && e.getModifierState("CapsLock")) setCaps(true);
    else setCaps(false);
    if (e.key === "Enter") onSubmit();
  }

  async function onSubmit() {
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      // 🔐 call your backend
      const r = await api.post("/auth/login", { email, password: pw });
      // expected: { token, user }
      const { token, user } = r.data || {};
      if (!token || !user) throw new Error("Invalid response");
      safeSet("token", token);
      safeSet("me", JSON.stringify(user));
      n("/dashboard");
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Sign in failed. Check your email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  function demoLogin() {
    // Optional “guest” preview if your API doesn’t provide one
    const user = { id: "guest", username: "guest", email: "guest@coderank.dev", level: 1, xp: 0 };
    safeSet("token", "guest-token");
    safeSet("me", JSON.stringify(user));
    n("/dashboard");
  }

  const disabled = !email || !pw || loading;

  return (
    <div className="relative min-h-[calc(100vh-56px)] grid place-items-center overflow-hidden">
      {/* softly animated background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 30%, rgba(139,92,246,.25), transparent 60%), radial-gradient(50% 50% at 70% 70%, rgba(236,72,153,.18), transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative w-full max-w-4xl grid md:grid-cols-[1.2fr_1fr] gap-6 px-6">
        {/* Left panel (tips) */}
        <div className="hidden md:flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <div className="text-2xl font-semibold text-white">Welcome back 👋</div>
            <div className="text-zinc-400 mt-1">
              Sign in to continue your CodeRank streak.
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="text-xs text-zinc-400 mb-1">Pro tip</div>
            <div className="text-zinc-200 transition-opacity duration-700">
              “{TIPS[tipIdx]}”
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            {["Easy", "Medium", "Hard"].map((d) => (
              <div
                key={d}
                className="rounded-lg border border-white/10 bg-white/5 p-3 text-center text-sm text-zinc-300"
              >
                {d} ladders
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur p-5 shadow-[0_0_0_1px_rgba(255,255,255,.04)]">
          <div className="text-white font-semibold text-lg">Sign In</div>

          {err ? (
            <div className="mt-3 text-sm rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 px-3 py-2">
              {err}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyUp={onKey}
              placeholder="Email"
              className="w-full rounded-md bg-zinc-900/70 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
            />

            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyUp={onKey}
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

            {caps ? (
              <div className="text-[11px] text-amber-300">Caps Lock is ON</div>
            ) : null}

            <button
              onClick={onSubmit}
              disabled={disabled}
              className="w-full rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-60 px-3 py-2 text-sm font-medium text-white transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-white/10" />
              <div className="text-[11px] text-zinc-500">or</div>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              onClick={demoLogin}
              className="w-full rounded-md ring-1 ring-white/15 hover:bg-white/5 px-3 py-2 text-sm"
              title="Preview without creating an account"
            >
              Try a demo account
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500">
            <Link to="/signup" className="hover:text-zinc-300">
              Don’t have an account? <span className="text-violet-300">Sign up</span>
            </Link>
            <Link to="/reset" className="hover:text-zinc-300">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
