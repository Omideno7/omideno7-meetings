# OmideNo7 Meetings 1.24.0 Final Stabilize

This package focuses on avoiding old cached PWA code, clarifying LiveKit diagnostics, and keeping Supabase tables separated from the main church app.

Important:
- LiveKit does not require a Supabase table for API secrets.
- Secrets stay in Vercel only.
- Supabase stores app access, waiting room, room settings, participants, chat, profile settings, and optional non-secret public LiveKit settings.

Diagnostics:
- /api/livekit/debug checks environment variables.
- /api/livekit/health also tries creating a server-side LiveKit token without exposing it.
