# Supabase integration guide

This document describes how to integrate Supabase (Auth + Postgres) with the OmideNo7 Meetings backend. Supabase is the recommended authentication provider for the MVP because it provides managed Postgres, Auth (email verification, social), and a low-friction developer experience.

Recommended flow
1. Create a Supabase project (https://app.supabase.com). Note the project URL and the Service Role Key (you will need it for server-side operations).
2. Configure environment variables in GitHub Secrets (or in `.env` for local dev):
   - SUPABASE_URL=https://<project>.supabase.co
   - SUPABASE_SERVICE_KEY=<service-role-key>
   - SUPABASE_ANON_KEY=<anon-key> (optional; used by web client)
3. Server-side responsibilities
   - Use the SERVICE_ROLE_KEY for admin operations (create user, list users, assign metadata/roles).
   - Verify JWTs on protected endpoints by validating the Supabase JWT or by using Supabase REST to retrieve the user.

Server-side examples (notes)
- Create user (admin): POST to `${SUPABASE_URL}/auth/v1/admin/users` with `Authorization: Bearer <SERVICE_KEY>` and body `{ email, password, user_metadata }`.
- Verify token (server): Supabase JWTs are standard JWTs; validate signature using the project's JWKs or call `GET ${SUPABASE_URL}/auth/v1/user` with `Authorization: Bearer <JWT>` to resolve the user (useful for quick checks but has network cost).

Security
- Never embed the Service Role Key in client-side code. Keep it in server-only secrets (GitHub Secrets for CI/CD or container env).
- Owner approval workflow: Keep an AccessRequest table in Postgres. After approving a request you can create the user in Supabase via the admin API and set a role flag in user_metadata or the local User table.

Local dev notes
- For local development you can use a `.env` with the Supabase variables (do NOT commit this file).
- We use the `SUPABASE_SERVICE_KEY` only from the backend.

Next steps for this repo
- Add the following secrets in repository settings before enabling full auth flows:
  - SUPABASE_URL
  - SUPABASE_SERVICE_KEY
  - SUPABASE_ANON_KEY (optional for web)

See backend `backend/src/modules/auth/supabase.service.ts` for a small server-side helper (stub) to create/verify users.
