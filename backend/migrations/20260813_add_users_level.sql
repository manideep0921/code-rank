-- users.level is read and written throughout the app (auth, profile, judge,
-- submissions, leaderboard, User model) as `1 + FLOOR(xp/100)`, but the
-- bootstrap migration never actually created the column -- so every path
-- that touched it (signup, login, submitting a solution, viewing a profile,
-- the leaderboard) failed with "column \"level\" of relation \"users\" does
-- not exist". Added here with a default and a matching backfill formula.

ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

UPDATE users SET level = GREATEST(1, 1 + FLOOR(COALESCE(xp, 0) / 100.0))
WHERE level IS NULL OR level = 1;
