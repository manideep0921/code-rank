-- Extended user profile (one row per user)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id    INTEGER PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  full_name  TEXT,
  bio        TEXT,
  location   TEXT,
  website    TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Personal notes (many per user)
CREATE TABLE IF NOT EXISTS public.user_notes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user ON public.user_notes(user_id);

-- default profile rows for existing users
INSERT INTO public.user_profiles (user_id)
SELECT u.id FROM public.users u
LEFT JOIN public.user_profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;
