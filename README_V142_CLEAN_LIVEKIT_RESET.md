# OmideNo7 Meetings v1.42.0 — Clean LiveKit Reset

This upload intentionally restores the clean LiveKit connection flow from the last stable Chrome-working line (v1.28) and removes the later Safari retry/fresh-room/native retry experiments that caused connection failures on desktop too.

## What to keep in Vercel

Supabase stays the same as the old working project. LiveKit uses the new EU project.

Required environment variables:

```txt
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://bruhsxhplgmzlttgyvfa.supabase.co
SUPABASE_URL=https://bruhsxhplgmzlttgyvfa.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<old Supabase publishable/anon key>
SUPABASE_SERVICE_ROLE_KEY=<old Supabase secret/service_role key>

LIVEKIT_URL=wss://<new LiveKit EU host>
LIVEKIT_API_KEY=<new LiveKit API key>
LIVEKIT_API_SECRET=<new LiveKit API secret>
VITE_LIVEKIT_WS_URL=wss://<same new LiveKit EU host>
VITE_LIVEKIT_ENABLED=true
```

After upload, redeploy with cleared Vercel build cache.

Test health:

```txt
/api/livekit/health
```

Then test on laptop Chrome first:

```txt
/?v=v142-clean-livekit-reset
```
