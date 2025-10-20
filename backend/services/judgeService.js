// backend/services/judgeService.js
import pool from "../config/db.js";
import { runCode } from "./execService.js";
import { buildHarness } from "./harnesses.js";
import slugify from "../utils/slugify.js"; // or however you access slug

export async function judgeSubmission({ problemId, language, userCode }) {
  // fetch problem (for slug), fetch tests
  const { rows: prow } = await pool.query(
    "SELECT id, slug, xp FROM public.problems WHERE id=$1",
    [problemId]
  );
  if (!prow.length) throw new Error("Problem not found");
  const problem = prow[0];

  const { rows: tests } = await pool.query(
    "SELECT id, input_text, expected_out FROM public.problem_tests WHERE problem_id=$1 ORDER BY id",
    [problemId]
  );
  if (!tests.length) throw new Error("No tests for this problem");

  const harness = buildHarness(language, problem.slug); // throws if missing
  const sep = language === "python" ? "\n\n" : "\n\n";
  const codeToRun = `${userCode}${sep}${harness}`;

  const results = [];
  let allPassed = true;

  for (const t of tests) {
    const r = await runCode({ language, code: codeToRun, stdin: t.input_text });
    const out = (r.stdout || "").trim();
    const exp = (t.expected_out || "").trim();
    const pass = (out === exp);
    if (!pass) allPassed = false;
    results.push({
      testId: t.id,
      pass,
      stdout: r.stdout,
      stderr: r.stderr,
      exitCode: r.exitCode,
      expected: exp,
    });
    if (r.exitCode !== 0) allPassed = false;
  }

  return {
    ok: true,
    problem,
    allPassed,
    passed: results.filter(x => x.pass).length,
    total: results.length,
    results,
  };
}
