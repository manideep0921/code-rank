# CodeRank

A gamified coding practice platform. Solve problems, get code run against test cases inside Docker sandboxes, earn XP and badges, and climb a leaderboard.

## Features

- Problem catalog with detail pages, difficulty tiers, and per-problem submission history
- Code execution in isolated Docker containers, one runner image per language (Python, Node, C++, Java)
- XP and leveling system (easy problems worth 20 XP, medium 40, hard 80) with badge rewards
- Global leaderboard and per-user profile stats
- Auth with bcrypt-hashed passwords, session-protected routes via middleware
- Notes feature for users to save thoughts against a problem

## Architecture

```
code-rank/
├── backend/
│   ├── routes/          # auth, problems, run, submit, submissions, leaderboard, user, profile, notes
│   ├── controllers/     # request handlers per resource
│   ├── services/        # judgeService (test execution), execService (sandbox runner)
│   ├── models/          # User, Problem, Submission, badges
│   └── middleware/       # auth, requireAuth
├── frontend/             # React (Vite) + Tailwind
└── docker/                # one Dockerfile per supported language runner
```

Code submissions are routed through `judgeService`/`execService`, which run user code inside the matching language's Docker container rather than executing it directly on the host.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Code execution | Docker (separate image per language: Python, Node, C++, Java) |
| Auth | JWT, bcrypt password hashing |

## Setup

**Backend**

```bash
cd backend
cp .env.example .env   # set PGHOST/PGUSER/PGPASSWORD/JWT_SECRET
npm install
npm run dev
curl http://localhost:8080/health
```

**Frontend**

```bash
cd frontend
echo "VITE_API_BASE=http://localhost:8080" > .env
npm install
npm run dev
```

**Language runner images**

```bash
docker build -t coderank-python ./docker/python
docker build -t coderank-node   ./docker/node
docker build -t coderank-cpp    ./docker/cpp
docker build -t coderank-java   ./docker/java
```

## API Overview

```
POST   /api/auth/signup
POST   /api/auth/signin
GET    /api/auth/me

GET    /api/problems
GET    /api/problems/:idOrSlug
POST   /api/run              run code against sample input
POST   /api/run/sandbox
POST   /api/submit           submit for grading
GET    /api/submissions/user/:id
GET    /api/submissions/problem/:problemId

GET    /api/leaderboard
GET    /api/user/overview
GET    /api/profile/:id
```

## Notes

Passwords are hashed with bcrypt via Postgres's `crypt(..., gen_salt('bf'))` rather than in application code.
