-- Ensure tables exist
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  icon VARCHAR(120) DEFAULT ''
);
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_awarded_at ON user_badges(awarded_at DESC);

-- Seed a badge if missing
INSERT INTO badges (slug, name, description, icon)
SELECT 'hello-world', 'Hello World', 'First successful submission', '🏁'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE slug = 'hello-world');

-- Seed an award for user_id=1 if they don't have it yet
INSERT INTO user_badges (user_id, badge_id)
SELECT 1, b.id FROM badges b
WHERE b.slug = 'hello-world'
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub WHERE ub.user_id = 1 AND ub.badge_id = b.id
  );
