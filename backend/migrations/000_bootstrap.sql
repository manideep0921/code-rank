BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS problems (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  difficulty TEXT,
  prompt TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  language VARCHAR(30),
  code TEXT,
  status TEXT,
  output TEXT,
  error TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Seed a couple of problems for the UI
INSERT INTO problems (title, slug, difficulty, prompt)
VALUES
('Print Hello', 'print-hello', 'easy', 'Write a program that prints "Hello, CodeRank!"')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
