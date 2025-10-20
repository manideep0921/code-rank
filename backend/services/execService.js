// backend/services/execService.js
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/* ---------- Language normalization ---------- */
function normalizeLang(langRaw = "") {
  const k = String(langRaw).toLowerCase().trim();
  if (["js", "javascript", "node"].includes(k)) return "javascript";
  if (["py", "python"].includes(k)) return "python";
  if (["c++", "cpp", "cplusplus"].includes(k)) return "cpp";
  if (k === "java") return "java";
  return k || "python";
}

/* ---------- File & image maps ---------- */
const FILE_MAP = {
  python: { name: "main.py" },
  javascript: { name: "main.js" },
  cpp: { name: "main.cpp" },
  java: { name: "Main.java" },
};

const IMAGE_MAP = {
  python: "coderank-python",
  javascript: "coderank-node",
  cpp: "coderank-cpp",
  java: "coderank-java",
};

/* ---------- Temp dir helper ---------- */
function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), "coderank-"));
}

/* ---------- Generic spawn with stdin + timeout ---------- */
function spawnWithInput(cmd, args, input = "", { timeoutMs = 30_000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill("SIGKILL"); } catch {}
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        return resolve({ stdout, stderr: stderr || "Time Limit Exceeded", exitCode: 124 });
      }
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });

    if (input) child.stdin.write(String(input));
    child.stdin.end();
  });
}

/* =========================================================
 * runLocal(language, code, stdin?, opts?)
 * Quick local execution (no Docker) for dev.
 * Supports: javascript, python
 * Returns: { stdout, stderr, exitCode }
 * ======================================================= */
export async function runLocal(language, code, stdin = "", opts = {}) {
  const lang = normalizeLang(language);
  const dir = makeTmpDir();
  try {
    if (lang === "javascript") {
      const file = join(dir, FILE_MAP.javascript.name);
      writeFileSync(file, String(code ?? ""), "utf8");
      // Use current Node runtime
      return await spawnWithInput(process.execPath, [file], String(stdin ?? ""), {
        timeoutMs: opts.timeoutMs ?? 5_000,
      });
    }

    if (lang === "python") {
      const file = join(dir, FILE_MAP.python.name);
      writeFileSync(file, String(code ?? ""), "utf8");
      return await spawnWithInput("python3", [file], String(stdin ?? ""), {
        timeoutMs: opts.timeoutMs ?? 5_000,
      });
    }

    return { stdout: "", stderr: `Unsupported language for runLocal: ${language}`, exitCode: 2 };
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

/* =========================================================
 * runInSandbox(language, code, stdin?)
 * Docker-based isolated execution.
 * Supports: javascript, python, cpp, java (requires images)
 * Returns: { status: "success"|"error", output, error|null }
 * ======================================================= */
export async function runInSandbox(language, code, stdin = "", opts = {}) {
  const lang = normalizeLang(language);
  const image = IMAGE_MAP[lang];
  const fileMeta = FILE_MAP[lang];

  if (!image || !fileMeta) {
    return { status: "error", output: "", error: `Unsupported language: ${language}` };
  }

  const dir = makeTmpDir();
  try {
    const srcPath = join(dir, fileMeta.name);
    writeFileSync(srcPath, String(code ?? ""), "utf8");

    // Mount tmp dir to /app inside container; image ENTRYPOINT should handle /app/*.
    const args = ["run", "--rm", "-v", `${dir}:/app`, image];

    const { stdout, stderr, exitCode } = await spawnWithInput("docker", args, String(stdin ?? ""), {
      timeoutMs: opts.timeoutMs ?? 30_000,
    });

    if (exitCode === 0) {
      const e = String(stderr || "");
      return { status: "success", output: String(stdout || ""), error: e.length ? e : null };
    }
    return {
      status: "error",
      output: String(stdout || ""),
      error: String(stderr || `exit ${exitCode}`),
    };
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

/* =========================================================
 * runCode({...}) — object form with stdin support
 * Also supports legacy positional call signature for compatibility:
 *   runCode(language, code, stdin?, opts?)
 * Returns: { status, output, error }
 * ======================================================= */
export async function runCode(arg1, arg2, arg3, arg4) {
  // Normalize arguments to object shape
  let language, code, stdin = "", opts = {};
  if (typeof arg1 === "object" && arg1 !== null) {
    ({ language, code, stdin = "" } = arg1);
    opts = arg2 || {};
  } else {
    language = arg1;
    code = arg2;
    stdin = arg3 ?? "";
    opts = arg4 || {};
  }

  try {
    const r = await runInSandbox(language, code, stdin, opts);
    return r;
  } catch {
    const { stdout, stderr, exitCode } = await runLocal(language, code, stdin, opts);
    return {
      status: exitCode === 0 ? "success" : "error",
      output: stdout ?? "",
      error: stderr || (exitCode === 0 ? null : `exit ${exitCode}`),
    };
  }
}

export default { runInSandbox, runLocal, runCode };
