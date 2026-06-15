# Step 20 — Supabase Setup Guide

1. Create Supabase account.
2. Create new project.
3. Open SQL Editor.
4. Run `0001_initial_schema.sql`.
5. Run `0002_rls_policies.sql`.
6. Run `0003_seed_demo_data.sql`.
7. Run `0004_storage_buckets.sql`.
8. Copy Project URL and publishable/anon key.
9. Add values to Vercel Environment Variables.
10. Set `VITE_DATA_MODE=supabase`.
11. Redeploy.

Never put service-role key, database password, or LiveKit secrets in frontend code.
