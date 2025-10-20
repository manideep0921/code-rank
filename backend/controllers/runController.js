// backend/controllers/runController.js
import { runLocal, runInSandbox, runCode as runAutoExec } from "../services/execService.js";

/**
 * Normalize executor results to the legacy UI shape.
 * - Sandbox/auto {status, output, error} → {ok, stdout, stderr, exitCode}
 * - Local {stdout, stderr, exitCode}     → {ok, stdout, stderr, exitCode}
 */
function toLegacyShapeFromSandbox(result) {
  const ok = result?.status === "success";
  return {
    ok,
    stdout: String(result?.output ?? ""),
    stderr: String(result?.error ?? ""),
    exitCode: ok ? 0 : 1,
  };
}

function toLegacyShapeFromLocal(result) {
  return {
    ok: true,
    stdout: String(result?.stdout ?? ""),
    stderr: String(result?.stderr ?? ""),
    exitCode: typeof result?.exitCode === "number" ? result.exitCode : 0,
  };
}

/**
 * POST /api/run
 * body: { language: "javascript"|"python"|"cpp"|"java", code: string, input?: string }
 * resp: { ok: true, stdout, stderr, exitCode }
 *
 * PURE LOCAL execution (no Docker). Keeps the legacy response shape the UI expects.
 */
export async function run(req, res) {
  try {
    const { language, code, input = "" } = req.body || {};
    if (!language || !code) {
      return res.status(400).json({ error: "language and code required" });
    }
    const result = await runLocal(String(language), String(code), String(input));
    return res.json(toLegacyShapeFromLocal(result));
  } catch (e) {
    console.error("[run/local]", e);
    return res.status(500).json({ error: "Execution error" });
  }
}

/**
 * POST /api/run/sandbox
 * body: { language, code, input? }
 * resp: { ok, stdout, stderr, exitCode }
 *
 * Docker sandboxed execution (preferred for prod). Normalized to legacy shape.
 */
export async function runSandbox(req, res) {
  try {
    const { language, code, input = "" } = req.body ?? {};
    if (!language || !code) {
      return res.status(400).json({ error: "language and code required" });
    }
    const result = await runInSandbox(String(language), String(code), String(input));
    return res.status(200).json(toLegacyShapeFromSandbox(result));
  } catch (e) {
    console.error("[run/sandbox]", e);
    return res
      .status(500)
      .json({ ok: false, stdout: "", stderr: e?.message || "Internal error", exitCode: 1 });
  }
}

/**
 * POST /api/run/auto
 * body: { language, code, input? }
 * resp: { ok, stdout, stderr, exitCode }
 *
 * Tries Docker sandbox first; if it fails, falls back to local.
 * Normalized to legacy shape so the UI can print output consistently.
 */
export async function runAuto(req, res) {
  try {
    const { language, code, input = "" } = req.body ?? {};
    if (!language || !code) {
      return res.status(400).json({ error: "language and code required" });
    }
    const result = await runAutoExec(String(language), String(code), String(input));
    if ("status" in (result || {})) {
      return res.status(200).json(toLegacyShapeFromSandbox(result));
    }
    // Defensive: if a local-shaped result bubbled up directly
    return res.status(200).json(toLegacyShapeFromLocal(result));
  } catch (e) {
    console.error("[run/auto]", e);
    return res
      .status(500)
      .json({ ok: false, stdout: "", stderr: e?.message || "Internal error", exitCode: 1 });
  }
}

export default { run, runSandbox, runAuto };
