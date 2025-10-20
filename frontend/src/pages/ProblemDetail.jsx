// src/pages/ProblemDetail.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import CodeEditor from "../components/CodeEditor";

/* ------------------ helpers ------------------ */
const LANGS = [
  { key: "python", label: "Python", ext: "py" },
  { key: "javascript", label: "JavaScript", ext: "js" },
  { key: "cpp", label: "C++", ext: "cpp" },
  { key: "java", label: "Java", ext: "java" },
];

function useMe() {
  try {
    return JSON.parse(localStorage.getItem("me") || "null");
  } catch {
    return null;
  }
}
function normDiff(d = "") {
  d = d.toLowerCase();
  return ["easy", "medium", "hard"].includes(d) ? d : "easy";
}
const DIFF_COLORS = {
  easy: "text-emerald-300",
  medium: "text-amber-300",
  hard: "text-rose-300",
};

const DEFAULT_SNIPPETS = {
  python: `# Write your code here
print("Hello, CodeRank!")`,
  javascript: `// Write your code here
console.log("Hello, CodeRank!");`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
int main(){ cout << "Hello, CodeRank!\\n"; }`,
  java: `import java.util.*;
public class Main {
  public static void main(String[] args){
    System.out.println("Hello, CodeRank!");
  }
}`,
};

function useTimer(active) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return { secs, label: `${mm}:${ss}` };
}

/* ------------------ main ------------------ */
export default function ProblemDetail() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const me = useMe();

  /* ---- state ---- */
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const initialLang = useMemo(() => {
    const q = sp.get("lang");
    if (LANGS.some((l) => l.key === q)) return q;
    return "python";
  }, [sp]);

  const [lang, setLang] = useState(initialLang);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [status, setStatus] = useState(""); // "Accepted" | "Wrong Answer" | "Runtime Error" | etc.

  // timer starts when page visible
  const { label: timerLabel } = useTimer(true);

  const codeKey = (pid, l) => `code:${pid}:${l}`;
  const inputKey = (pid) => `stdin:${pid}`;

  /* ---- fetch problem ---- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Try list scan by slug/id
        const r = await api.get("/problems");
        const list = Array.isArray(r.data) ? r.data : [];
        let p =
          list.find((it) => it.slug === slug) ||
          list.find((it) => String(it.id) === String(slug));

        // Fallback: attempt single fetch if supported
        if (!p) {
          try {
            const r2 = await api.get(`/problems/${slug}`);
            p = r2.data;
          } catch {}
        }

        setProblem(p || null);

        // restore autosaved code/stdin
        const chosenLang = initialLang;
        if (p) {
          const saved = localStorage.getItem(codeKey(p.id, chosenLang));
          setCode(saved || DEFAULT_SNIPPETS[chosenLang] || "");
          const insaved = localStorage.getItem(inputKey(p.id));
          setStdin(insaved || "");
        } else {
          setCode(DEFAULT_SNIPPETS[chosenLang]);
        }
      } catch (e) {
        console.error(e);
        setProblem(null);
        setCode(DEFAULT_SNIPPETS[initialLang]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* ---- keep lang in URL + load per-lang snippet/autosave ---- */
  useEffect(() => {
    setSp((prev) => {
      const n = new URLSearchParams(prev);
      n.set("lang", lang);
      return n;
    }, { replace: true });

    if (problem?.id) {
      const saved = localStorage.getItem(codeKey(problem.id, lang));
      setCode(saved || DEFAULT_SNIPPETS[lang] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, problem?.id]);

  /* ---- autosave code & input ---- */
  useEffect(() => {
    if (problem?.id) localStorage.setItem(codeKey(problem.id, lang), code || "");
  }, [code, lang, problem?.id]);

  useEffect(() => {
    if (problem?.id) localStorage.setItem(inputKey(problem.id), stdin || "");
  }, [stdin, problem?.id]);

  /* ---- actions ---- */
  const onRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setStatus("");
    setStdout("");
    setStderr("");
    try {
      const r = await api.post("/run", { language: lang, code, stdin });
      const { stdout: o = "", stderr: e = "", exitCode } = r.data || {};
      setStdout(String(o));
      setStderr(String(e));
      setStatus(exitCode === 0 ? "Ran successfully" : `Exited ${exitCode}`);
    } catch (err) {
      setStderr("Failed to run code. Check /api/run service.");
      setStatus("Run error");
    } finally {
      setRunning(false);
    }
  }, [running, lang, code, stdin]);

  const onSubmit = useCallback(async () => {
    if (submitting || !problem?.id) return;
    setSubmitting(true);
    setStatus("");
    try {
      // Preferred: real submission endpoint
      const payload = {
        user_id: me?.id,
        problem_id: problem.id,
        language: lang,
        code,
        stdin: stdin || null,
      };
      let accepted = false;
      try {
        const resp = await api.post("/submissions", payload);
        const st = String(resp.data?.status || "").toLowerCase();
        accepted = st.includes("accept");
        setStdout(resp.data?.output || "");
        if (resp.data?.error) setStderr(resp.data.error);
        setStatus(resp.data?.status || (accepted ? "Accepted" : "Submitted"));
      } catch {
        // Fallback: run-only
        const run = await api.post("/run", { language: lang, code, stdin });
        setStdout(run.data?.stdout || "");
        setStderr(run.data?.stderr || "");
        setStatus("Submitted (local run)");
      }
    } catch (e) {
      setStatus("Submit failed");
      setStderr("Submission API not available or failed.");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, problem?.id, me?.id, lang, code, stdin]);

  // Keyboard shortcuts: attach once, cleanly swap handlers if identities change
  useEffect(() => {
    function onKey(e) {
      const tag = (e.target?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // Ctrl/Cmd + Enter => Run
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onRun();
      }
      // Ctrl/Cmd + S => Submit
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRun, onSubmit]);

  function onReset() {
    if (!lang) return;
    setCode(DEFAULT_SNIPPETS[lang] || "");
  }

  function useSampleInput(i = 0) {
    const smp = (problem?.samples && problem.samples[i]) || null;
    if (!smp) return;
    setStdin(String(smp.input ?? smp.in ?? ""));
  }

  /* ---- derived ---- */
  const diff = normDiff(problem?.difficulty);
  const xp = problem?.xp ?? 0;

  // best-effort theme read
  const isDark = (() => {
    try {
      return (
        document.documentElement.getAttribute("data-theme") === "dark" ||
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return true;
    }
  })();

  return (
    <div className="px-5 md:px-8 py-6 text-zinc-300">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-white">
              {loading ? "Loading…" : problem?.title || "Problem"}
            </h1>
            <div className="text-xs text-zinc-400 mt-1">
              Difficulty: <span className={DIFF_COLORS[diff]}>{diff}</span> • XP: {xp}
            </div>
          </div>

          <div className="text-xs text-zinc-400">
            Time on page: <span className="text-zinc-200">{timerLabel}</span>
          </div>
        </div>

        {/* Language & theme strip */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {LANGS.map((L) => (
              <button
                key={L.key}
                onClick={() => setLang(L.key)}
                className={
                  "px-3 py-1.5 rounded-lg text-sm ring-1 transition " +
                  (lang === L.key
                    ? "bg-white/10 text-white ring-white/15"
                    : "text-zinc-400 hover:text-white ring-white/10 hover:bg-white/5")
                }
              >
                {L.label}
              </button>
            ))}
          </div>

          <Link to="/problems" className="text-xs text-zinc-400 hover:text-zinc-200">
            ← Back to Problems
          </Link>
        </div>

        {/* Problem description / samples */}
        {problem?.statement ||
        problem?.description ||
        (Array.isArray(problem?.samples) && problem.samples.length > 0) ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
            {problem?.statement || problem?.description ? (
              <div className="prose prose-invert prose-zinc max-w-none text-sm">
                <div
                  dangerouslySetInnerHTML={{
                    __html: String(problem.statement || problem.description || "").replace(
                      /\n/g,
                      "<br/>"
                    ),
                  }}
                />
              </div>
            ) : null}

            {Array.isArray(problem?.samples) && problem.samples.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3">
                {problem.samples.map((smp, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-black/40 p-3"
                  >
                    <div className="text-xs text-zinc-400 mb-1">Sample #{i + 1}</div>
                    <div className="text-[11px] text-zinc-500 mb-1">Input</div>
                    <pre className="text-xs bg-zinc-900/70 rounded p-2 overflow-x-auto">
                      {String(smp.input ?? smp.in ?? "")}
                    </pre>
                    <div className="text-[11px] text-zinc-500 mt-2 mb-1">Output</div>
                    <pre className="text-xs bg-zinc-900/70 rounded p-2 overflow-x-auto">
                      {String(smp.output ?? smp.out ?? "")}
                    </pre>
                    <button
                      onClick={() => useSampleInput(i)}
                      className="mt-2 text-xs rounded-md px-2 py-1 ring-1 ring-white/15 hover:bg-white/5"
                    >
                      Use as input
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Editor */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden">
          <div className="border-b border-white/10 px-3 py-2 text-xs text-zinc-400">
            Editor • {lang} • autosave on
          </div>
          <div className="p-3">
            {CodeEditor ? (
              <CodeEditor
                language={lang}
                theme={isDark ? "dark" : "light"}
                value={code}
                onChange={setCode}
                className="h-[360px]"
              />
            ) : (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="h-[360px] w-full resize-none rounded-lg bg-zinc-900/70 p-3 font-mono text-sm text-zinc-100 ring-1 ring-white/10 focus:outline-none focus:ring-violet-500"
              />
            )}
          </div>
          <div className="px-3 pb-3 flex items-center gap-2">
            <button
              onClick={onRun}
              disabled={running}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 px-3 py-1.5 text-sm"
              title="Ctrl/Cmd + Enter"
            >
              {running ? "Running…" : "Run Code"}
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-3 py-1.5 text-sm text-white"
              title="Ctrl/Cmd + S"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button
              onClick={onReset}
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/5"
              title="Reset to starter code"
            >
              Reset
            </button>

            <div className="ml-auto text-xs text-zinc-500">
              Shortcuts:{" "}
              <kbd className="px-1 py-0.5 bg-white/10 rounded">Ctrl/Cmd + Enter</kbd> run •{" "}
              <kbd className="px-1 py-0.5 bg-white/10 rounded">Ctrl/Cmd + S</kbd> submit
            </div>
          </div>
        </div>

        {/* I/O & status */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="px-3 py-2 text-xs text-zinc-400 border-b border-white/10 flex items-center justify-between">
              <span>Custom Input (stdin)</span>
              <button
                onClick={() => setStdin("")}
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="w-full h-40 bg-transparent p-3 text-sm focus:outline-none"
              placeholder="Type input that your program will read from STDIN…"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="px-3 py-2 text-xs text-zinc-400 border-b border-white/10 flex items-center justify-between">
              <span>Program Output</span>
              <span
                className={
                  "text-[11px] " + (status.toLowerCase().includes("accept") ? "text-emerald-300" : "text-zinc-400")
                }
              >
                {status || "—"}
              </span>
            </div>
            <div className="grid grid-rows-2 gap-0">
              <pre className="h-24 overflow-auto p-3 text-sm">{stdout || "—"}</pre>
              <div className="border-t border-white/10">
                <div className="px-3 py-1 text-[11px] text-zinc-500">Errors / Status</div>
                <pre className="h-20 overflow-auto px-3 pb-3 text-sm text-rose-300">
                  {stderr || "—"}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div>Pro tip: start with small prints, then build up. Consistency &gt; intensity.</div>
          <Link to="/problems" className="hover:text-zinc-300">
            Back to Problems →
          </Link>
        </div>
      </div>
    </div>
  );
}
