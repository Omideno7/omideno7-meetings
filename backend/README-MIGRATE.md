# Backend migration & local development

This document explains how to run Prisma migrations and seed the local database for the backend.

Prerequisites
- Node 18+
- npm
- Docker & docker-compose (recommended for local Postgres)

Quick start (local with docker-compose)
1. Copy .env.example to .env and confirm DATABASE_URL points to the docker-compose Postgres or your DB.

2. Start Postgres + backend containers (docker-compose will build backend image):
   docker-compose up --build -d

3. Run migrations and seed locally (from repository root):
   ./backend/scripts/migrate.sh

4. To run backend in dev mode locally (not in container):
   cd backend
   npm install
   npm run dev

Notes
- For CI use `npx prisma migrate deploy` to apply already-created migration SQL.
- If you need to reset migrations locally: `npx prisma migrate reset --force` (destructive).
