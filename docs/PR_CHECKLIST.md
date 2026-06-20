# PR checklist

When the initial-setup branch is ready, please follow this checklist before merging to main:

- [ ] Review backend endpoints and API surface
- [ ] Confirm secrets are set in GitHub (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, DATABASE_URL, S3_* if used)
- [ ] Run `./backend/scripts/migrate.sh` and verify DB tables created
- [ ] Start web app (cd web && npm install && npm run dev) and test forms
- [ ] Run basic end-to-end: submit access request -> confirm in DB -> list pending
- [ ] (Optional) Review README and docs for accuracy
