// backend/controllers/submissionController.js
import pool from "../config/db.js";
import { runInSandbox } from "../services/execService.js";

/* ------------------------------------------------------
 * Optional judge path: use judgeService if available.
 * If ../services/judgeService.js exports judgeSubmission,
 * we'll use it for /api/submit to run I/O tests.
 * ---------------------------------------------------- */
let judgeSubmission = null;
try {
  const mod = await import("../services/judgeService.js");
  judgeSubmission = mod?.judgeSubmission ?? null;
} catch {
  // judgeService not present — /api/submit will fall back to sandbox-only run
}

/* ------------------- Helpers ------------------- */

/** Award XP ONLY on the first successful submission for (user, problem). */
async function awardXpOnFirstSolve(userId, problemId) {
  if (!Number.isFinite(userId) || !Number.isFinite(problemId)) return;

  // Count successes for this (user, problem)
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS c
       FROM public.submissions
      WHERE user_id = $1
        AND problem_id = $2
        AND status = 'success'`,
    [userId, problemId]
  );
  const successCount = countRows?.[0]?.c ?? 0;

  if (successCount !== 1) return; // not the first time

  // Get XP from problems table
  const { rows: pRows } = await pool.query(
    `SELECT xp FROM public.problems WHERE id = $1`,
    [problemId]
  );
  const gain = pRows?.[0]?.xp ?? 0;
  if (!Number.isFinite(gain) || gain <= 0) return;

  // Update XP and level (level = 1 + floor(total_xp/100))
  await pool.query(
    `UPDATE public.users
        SET xp = COALESCE(xp, 0) + $1,
            level = GREATEST(1, 1 + FLOOR((COALESCE(xp, 0) + $1) / 100.0))
      WHERE id = $2`,
    [gain, userId]
  );
}

/* =========================================================
 * POST /api/submissions
 * Body: { user_id, problem_id, language, code }
 * Runs code in sandbox, stores submission, and awards XP only on first success.
 * Response: { submission_id, status, output, error }
 * ======================================================= */
export async function submitCode(req, res) {
  const { user_id, problem_id, language, code } = req.body ?? {};
  const uid = Number.parseInt(user_id, 10);
  const pid = Number.parseInt(problem_id, 10);

  try {
    // Execute code in sandbox (no stdin for judged route here)
    const result = await runInSandbox(String(language || ""), String(code || ""));

    // Insert submission (use output/error columns for consistency)
    let submissionId = null;
    try {
      const text = `
        INSERT INTO public.submissions (user_id, problem_id, language, code, status, output, error)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      const vals = [
        Number.isFinite(uid) ? uid : 1,
        Number.isFinite(pid) ? pid : null,
        String(language || ""),
        String(code || ""),
        String(result.status || "error"),
        result.output ?? "",
        result.error ?? null,
      ];
      const r = await pool.query(text, vals);
      submissionId = r?.rows?.[0]?.id ?? null;
    } catch (e) {
      console.error("[submissions.insert] failed:", e);
      submissionId = Math.floor(Date.now() / 1000); // non-fatal fallback id
    }

    // Award XP only on first success
    if (result?.status === "success" && Number.isFinite(uid) && Number.isFinite(pid)) {
      try {
        await awardXpOnFirstSolve(uid, pid);
      } catch (e) {
        console.error("[awardXpOnFirstSolve] failed:", e);
      }
    }

    return res.status(200).json({
      submission_id: submissionId,
      status: result.status,
      output: result.output ?? "",
      error: result.error ?? null,
    });
  } catch (e) {
    console.error("[submitCode fatal]", e);
    return res.status(500).json({
      submission_id: null,
      status: "error",
      output: "",
      error: e?.message || "Internal error",
    });
  }
}

/* =========================================================
 * POST /api/submit  (judged route)
 * Requires auth middleware to set req.user.id (but will also
 * accept user_id in body as a fallback).
 *
 * If judgeService.judgeSubmission is available, it runs full
 * public+hidden tests and returns a rich verdict:
 *   { verdict, passed, total, cases, added_xp, submission }
 * If not available, it falls back to sandbox run and mimics a
 * one-case "AC/WA/RE" style response.
 * ======================================================= */
export async function submit(req, res) {
  try {
    // Prefer req.user.id if present; else fall back to body.user_id
    const authUserId = Number.parseInt(req.user?.id ?? req.body?.user_id, 10);
    const problemId = Number.parseInt(req.body?.problem_id ?? req.body?.problemId, 10);
    const language = String(req.body?.language || "");
    const code = String(req.body?.code || "");

    if (!Number.isFinite(authUserId)) return res.status(401).json({ error: "Unauthorized" });
    if (!Number.isFinite(problemId) || !language || !code) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // If judgeService is present, run full judging
    if (typeof judgeSubmission === "function") {
      const judge = await judgeSubmission({ problemId, language, userCode: code });

      // Persist submission (use output/error columns; flatten case outputs)
      const status = judge.allPassed ? "success" : "failed";
      const outJoin = judge.results
        .map((r, i) => `#${i + 1} ${r.ok ? "OK" : "X"}\n${(r.stdout ?? "").toString().trim()}`)
        .join("\n");
      const errJoin = judge.results
        .map((r, i) => (r.stderr ? `#${i + 1} ${r.stderr}` : ""))
        .filter(Boolean)
        .join("\n") || null;

      const ins = `
        INSERT INTO public.submissions (user_id, problem_id, language, code, status, output, error)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id, user_id, problem_id, language, status, output, error, created_at
      `;
      const sRes = await pool.query(ins, [
        authUserId, problemId, language, code, status, outJoin, errJoin,
      ]);
      const submission = sRes.rows[0];

      // Award XP only if FIRST AC
      let added_xp = 0;
      if (judge.allPassed) {
        try {
          // Check if there's an earlier success
          const chk = await pool.query(
            `SELECT 1
               FROM public.submissions
              WHERE user_id = $1 AND problem_id = $2 AND status = 'success' AND id <> $3
              LIMIT 1`,
            [authUserId, problemId, submission.id]
          );
          const already = chk.rowCount > 0;
          if (!already) {
            const { rows } = await pool.query(
              `SELECT xp FROM public.problems WHERE id = $1`,
              [problemId]
            );
            added_xp = Number(rows?.[0]?.xp ?? 0);
            if (added_xp > 0) {
              await pool.query(
                `UPDATE public.users
                    SET xp = COALESCE(xp,0) + $1,
                        level = GREATEST(1, 1 + FLOOR((COALESCE(xp,0) + $1)/100.0))
                  WHERE id = $2`,
                [added_xp, authUserId]
              );
            }
          }
        } catch (e) {
          console.error("[award XP (judge)] failed:", e);
        }
      }

      return res.json({
        verdict: judge.allPassed ? "AC" : "WA", // judgeService may provide a finer verdict; map simply
        passed: judge.passed,
        total: judge.total,
        cases: judge.results,
        added_xp,
        submission,
      });
    }

    // ---- Fallback: no judgeService → single sandbox run ----
    const exec = await runInSandbox(language, code);
    const status = exec.status === "success" ? "success" : "failed";

    const ins = `
      INSERT INTO public.submissions (user_id, problem_id, language, code, status, output, error)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, user_id, problem_id, language, status, output, error, created_at
    `;
    const sRes = await pool.query(ins, [
      authUserId, problemId, language, code, status, exec.output ?? "", exec.error ?? null,
    ]);
    const submission = sRes.rows[0];

    // First-solve XP
    if (exec.status === "success") {
      try { await awardXpOnFirstSolve(authUserId, problemId); } catch (e) {
        console.error("[award XP (fallback)] failed:", e);
      }
    }

    // Mimic a one-case judge response
    return res.json({
      verdict: exec.status === "success" ? "AC" : "RE",
      passed: exec.status === "success" ? 1 : 0,
      total: 1,
      cases: [{
        ok: exec.status === "success",
        expected: "(manual verify)",
        got: exec.output ?? "",
        stderr: exec.error ?? "",
      }],
      added_xp: 0, // award (if any) already applied; we don't compute here
      submission,
    });
  } catch (e) {
    console.error("[submit (judge) fatal]", e);
    return res.status(500).json({ error: "Judge error" });
  }
}

export default { submitCode, submit };
