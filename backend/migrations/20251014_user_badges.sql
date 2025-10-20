-- Badges catalog
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  icon VARCHAR(120) DEFAULT '' -- optional (emoji or URL)
);

-- Link table for awards
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Useful index for lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_awarded_at ON user_badges(awarded_at DESC);

-- Seed a few badges if empty
INSERT INTO badges (slug, name, description, icon)
SELECT * FROM (VALUES
  ('hello-world', 'Hello World', 'First successful submission', '🏁'),
  ('loop-master', 'Loop Master', 'Completed a level-2 loops problem', '🔁'),
  ('condition-pro', 'Condition Pro', 'Completed a level-2 conditions problem', '🔀')
) AS v(slug,name,description,icon)
WHERE NOT EXISTS (SELECT 1 FROM badges);
