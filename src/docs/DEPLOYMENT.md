# Deployment notes

This document describes high-level steps to deploy the OmideNo7 Meetings platform (initial scaffold).

Stack (recommended for MVP):
- LiveKit Cloud for media
- Supabase (Postgres) for DB and Auth
- DigitalOcean Spaces (S3 compatible) for recordings
- Backend: NestJS (TypeScript)
- Web: React (TypeScript)
- Mobile: React Native (TypeScript)

Local development (docker-compose):
1. Copy `.env.example` to `.env` and fill DB and LiveKit values.
2. `docker-compose up --build` to run Postgres and backend (when backend added).

Deploy to cloud (high level):
- Provision Supabase or managed Postgres
- Create LiveKit Cloud account
- Provision S3/Spaces bucket and set CORS
- Create a domain and configure TLS (Let's Encrypt via ingress or managed provider)
- Configure CI/CD (GitHub Actions provided in .github/workflows)

Detailed step-by-step scripts will be added in infra/ and docs/ in follow-up commits.
