// backend/routes/run.js
import express from "express";
import { run, runSandbox, runAuto } from "../controllers/runController.js";

const router = express.Router();

/**
 * Normalize incoming body to support both { input } and { stdin }.
 * The controllers expect "input", some clients may send "stdin".
 */
function mapStdinToInput(req, _res, next) {
  if (req?.body && typeof req.body.stdin === "string" && req.body.input == null) {
    req.body.input = req.body.stdin;
  }
  next();
}

/**
 * Routes:
 *  POST /api/run           → Local execution (legacy UI shape: { ok, stdout, stderr, exitCode })
 *  POST /api/run/sandbox   → Docker sandboxed execution (normalized to legacy shape)
 *  POST /api/run/auto      → Try Docker first, fallback to local (normalized to legacy shape)
 *
 * All routes accept body: { language, code, input? } and also { stdin? } as an alias for input.
 */

router.post("/", mapStdinToInput, (req, res) => run(req, res));
router.post("/sandbox", mapStdinToInput, (req, res) => runSandbox(req, res));
router.post("/auto", mapStdinToInput, (req, res) => runAuto(req, res));

export default router;
