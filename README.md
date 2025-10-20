# CodeRank — Gamified Coding Practice

Monorepo:
- **backend/**: Node.js + Express + PostgreSQL + Docker runner (python/node/cpp/java)
- **frontend/**: React (Vite) + Tailwind

## Quick Start
### Backend
1) Copy `backend/.env` from example:

PORT=8080
JWT_SECRET=change-me
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=coderank
PGUSER=coderank_user
PGPASSWORD=cr_pass_123
2) Install & run:
```bash
cd backend
npm i
npm run dev
curl -s http://localhost:8080/health

cd frontend
echo "VITE_API_BASE=http://localhost:8080" > .env
npm i
npm run dev

docker build -t coderank-python ./docker/python
docker build -t coderank-node   ./docker/node
docker build -t coderank-cpp    ./docker/cpp
docker build -t coderank-java   ./docker/java

curl -sS -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"maxxpuser@example.com","password":"Passw0rd!"}'

Notes

Passwords stored with bcrypt via Postgres crypt(..., gen_salt('bf'))

Problems have XP (easy 20, medium 40, hard 80)
