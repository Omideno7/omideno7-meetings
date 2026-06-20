# Backend: next steps

The backend now includes:
- Requests module (POST /api/requests, GET /api/requests/pending)
- Prisma schema (AccessRequest, Meeting, WaitingEntry, Recording, User)

Next work planned (I will implement):
- LiveKit token endpoint (already scaffolded) and integration testing
- Waiting-room workflows (join/admit/reject) endpoints
- Move from in-memory to DB-backed persistence (Prisma already added)
- Add auth (Supabase recommended) and email notifications

