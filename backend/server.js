// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import pool from "./config/db.js";

// Routers
import authRoutes from "./routes/auth.js";
import problemsRoutes from "./routes/problems.js";
import problemDetailRoutes from "./routes/problemDetail.js";
import runRoutes from "./routes/run.js";
import submitRoutes from "./routes/submit.js";
import submissionsRoutes from "./routes/submissions.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import userBadgesRoutes from "./routes/userBadges.js";
import userRoutes from "./routes/user.js";

const app = express();

app.set("trust proxy", true);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemsRoutes);
app.use("/api/problemDetail", problemDetailRoutes);
app.use("/api/run", runRoutes);
app.use("/api/submit", submitRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/userBadges", userBadgesRoutes);
app.use("/api/user", userRoutes);

// Debug routes list
app.get("/api/_routes", (_req, res) => {
  const stack = app._router?.stack || [];
  const out = [];
  for (const layer of stack) {
    if (layer.route?.path) {
      const methods = Object.keys(layer.route.methods || {})
        .map((m) => m.toUpperCase())
        .join(",") || "ALL";
      out.push({ type: "route", path: layer.route.path, methods });
    }
  }
  res.json(out);
});

// 404 for unhandled /api paths
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

// Verify DB on boot
(async () => {
  try {
    const { rows } = await pool.query("SELECT NOW() now");
    console.log("[db] connected, time =", rows[0].now);
  } catch (e) {
    console.error("[db] connection failed:", e.message);
    process.exit(1);
  }
})();

// Start server
const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
