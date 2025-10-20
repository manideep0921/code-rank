// backend/controllers/judgeController.js
import pool from "../config/db.js";
import { runLocal } from "../services/execService.js";

// Trim helper (normalizes CRLF and trims)
const norm = (s) => String(s ?? "").replace(/\r/g, "").trim();

/**
 * In-memory test bank keyed by problem slug.
 * Public + hidden tests. Keep stdin→stdout I/O simple.
 * (You can move these to DB later.)
 */
const TESTS = {
  // ===== existing =====
  "print-hello": {
    public: [{ input: "", output: "Hello, CodeRank!" }],
    hidden: [{ input: "", output: "Hello, CodeRank!" }],
  },
  "sum-two-ints": {
    public: [{ input: "3 4", output: "7" }],
    hidden: [
      { input: "0 0", output: "0" },
      { input: "-5 2", output: "-3" },
      { input: "100 250", output: "350" },
    ],
  },
  "find-factorial": {
    public: [{ input: "5", output: "120" }],
    hidden: [
      { input: "0", output: "1" },
      { input: "1", output: "1" },
      { input: "6", output: "720" },
    ],
  },
  "palindrome-check": {
    public: [{ input: "madam", output: "YES" }],
    hidden: [
      { input: "coderank", output: "NO" },
      { input: "abba", output: "YES" },
    ],
  },
  "two-sum": {
    public: [{ input: "4\n2 7 11 15\n9", output: "0 1" }],
    hidden: [
      { input: "3\n3 2 4\n6", output: "1 2" },
      { input: "2\n3 3\n6", output: "0 1" },
    ],
  },

  // ===== NEW easy =====
  "reverse-string": {
    public: [{ input: "hello", output: "olleh" }],
    hidden: [{ input: "a", output: "a" }, { input: "abba", output: "abba" }],
  },
  "fizz-buzz": {
    public: [{ input: "5", output: "1\n2\nFizz\n4\nBuzz" }],
    hidden: [
      { input: "1", output: "1" },
      {
        input: "15",
        output:
          "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
      },
    ],
  },
  "max-of-three": {
    public: [{ input: "5 9 -1", output: "9" }],
    hidden: [{ input: "0 0 0", output: "0" }, { input: "-10 -3 -7", output: "-3" }],
  },
  "count-vowels": {
    public: [{ input: "banana", output: "3" }],
    hidden: [{ input: "aeiou", output: "5" }, { input: "bcdfg", output: "0" }],
  },
  "prime-check": {
    public: [{ input: "7", output: "YES" }],
    hidden: [
      { input: "1", output: "NO" },
      { input: "2", output: "YES" },
      { input: "12", output: "NO" },
    ],
  },

  // ===== NEW medium =====
  "fibonacci-n": {
    public: [{ input: "7", output: "13" }],
    hidden: [
      { input: "0", output: "0" },
      { input: "1", output: "1" },
      { input: "10", output: "55" },
    ],
  },
  gcd: {
    public: [{ input: "12 18", output: "6" }],
    hidden: [{ input: "0 5", output: "5" }, { input: "100 35", output: "5" }],
  },
  "anagram-check": {
    public: [{ input: "listen\nsilent", output: "YES" }],
    hidden: [{ input: "abc\nabz", output: "NO" }, { input: "aabb\nbaba", output: "YES" }],
  },
  "balanced-parentheses": {
    public: [{ input: "()[]{}", output: "YES" }],
    hidden: [{ input: "([)]", output: "NO" }, { input: "{[()]}", output: "YES" }],
  },
  "binary-search": {
    public: [{ input: "5\n1 3 5 7 9\n7", output: "3" }],
    hidden: [{ input: "3\n2 4 6\n5", output: "-1" }, { input: "1\n10\n10", output: "0" }],
  },

  // ===== NEW hard =====
  "longest-substring-unique": {
    public: [{ input: "abcabcbb", output: "3" }],
    hidden: [{ input: "bbbbb", output: "1" }, { input: "pwwkew", output: "3" }, { input: "", output: "0" }],
  },
  "matrix-rotate-90": {
    public: [{ input: "3\n1 2 3\n4 5 6\n7 8 9", output: "7 4 1\n8 5 2\n9 6 3" }],
    hidden: [{ input: "1\n5", output: "5" }, { input: "2\n1 2\n3 4", output: "3 1\n4 2" }],
  },
  "merge-intervals": {
    public: [{ input: "4\n1 3\n2 6\n8 10\n15 18", output: "1 6\n8 10\n15 18" }],
    hidden: [{ input: "3\n1 4\n4 5\n6 7", output: "1 5\n6 7" }, { input: "2\n1 2\n3 4", output: "1 2\n3 4" }],
  },
};

/**
 * POST /api/submit
 * body: { user_id, problem_id, language, code }
 * resp: {
 *   verdict: "AC"|"WA"|"RE"|"TLE",
 *   passed: number, total: number,
 *   cases: [{ ok, expected, got, input, stderr?, exitCode? }],
 *   added_xp: number,
 *   submission: { id, user_id, problem_id, language, status, output, error, created_at }
 * }
 */
export async function submit(req, res) {
  try {
    const { user_id, problem_id, language, code } = req.body || {};
    if (!user_id || !problem_id || !language || !code) {
      return res.status(400).json({ error: "user_id, problem_id, language, code required" });
    }

    // 1) Load problem (slug + xp)
    const pr = await pool.query(
      `SELECT id::bigint AS id, slug, xp FROM public.problems WHERE id=$1`,
      [problem_id]
    );
    if (!pr.rowCount) return res.status(404).json({ error: "Problem not found" });
    const problem = pr.rows[0];

    const bank = TESTS[problem.slug];
    if (!bank) return res.status(500).json({ error: "No tests defined for this problem" });

    const tests = [...(bank.public || []), ...(bank.hidden || [])];
    const total = tests.length;

    // 2) Run tests (stop on first WA/RE; ~4s time limit per test)
    const cases = [];
    for (const t of tests) {
      const result = await runLocal(language, code, t.input, { timeoutMs: 4000 });

      // Runtime error (or any stderr) → RE
      if (result.exitCode !== 0 || norm(result.stderr)) {
        cases.push({
          ok: false,
          input: t.input,
          expected: t.output,
          got: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        });
        break;
      }

      const ok = norm(result.stdout) === norm(t.output);
      cases.push({
        ok,
        input: t.input,
        expected: t.output,
        got: result.stdout,
      });
      if (!ok) break; // stop at first WA
    }

    const passed = cases.filter((c) => c.ok).length;

    // Verdict
    let verdict = "AC";
    if (passed < total) {
      const last = cases[cases.length - 1];
      verdict = last && (last.stderr || last.exitCode !== 0) ? "RE" : "WA";
    }

    // 3) Record submission (echo output/error for debugging)
    const status = verdict === "AC" ? "success" : "failed";
    const outJoin = cases
      .map((c, i) => `#${i + 1} ${c.ok ? "OK" : "X"}\n${norm(c.got)}`)
      .join("\n");
    const errJoin =
      cases
        .map((c, i) => (c.stderr ? `#${i + 1} ${c.stderr}` : ""))
        .filter(Boolean)
        .join("\n") || null;

    const ins = `
      INSERT INTO public.submissions (user_id, problem_id, language, code, status, output, error)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, user_id, problem_id, language, status, output, error, created_at
    `;
    const sRes = await pool.query(ins, [
      user_id,
      problem_id,
      language,
      code,
      status,
      outJoin,
      errJoin,
    ]);
    const submission = sRes.rows[0];

    // 4) Award XP only if this is the first AC for the user on this problem
    let added_xp = 0;
    if (verdict === "AC") {
      const chk = await pool.query(
        "SELECT 1 FROM public.submissions WHERE user_id=$1 AND problem_id=$2 AND status='success' AND id <> $3 LIMIT 1",
        [user_id, problem_id, submission.id]
      );
      const alreadySolvedBefore = chk.rowCount > 0;
      if (!alreadySolvedBefore) {
        added_xp = Number(problem.xp) || 0;
        await pool.query(
          "UPDATE public.users SET xp = xp + $1, level = 1 + FLOOR((xp + $1)/100.0) WHERE id = $2",
          [added_xp, user_id]
        );
      }
    }

    return res.json({
      verdict,
      passed,
      total,
      cases,
      added_xp,
      submission,
    });
  } catch (e) {
    console.error("[submit]", e);
    return res.status(500).json({ error: "Judge error" });
  }
}

export default { submit };
