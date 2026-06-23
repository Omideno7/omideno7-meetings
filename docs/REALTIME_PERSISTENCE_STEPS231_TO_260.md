# OmideNo7 Meetings — Realtime Persistence Steps 231–260

Fixes:
- Adds Supabase realtime meeting state tables.
- Host mic actions can now be saved to meeting_participants.
- Chat messages can now be saved to meeting_chat_messages.
- Meeting alerts/waiting alerts can be saved to meeting_alerts.
- Avatar URL is persisted in profiles.avatar_url.
- Mobile bottom toolbar gets safe-area padding for iPhone.
- Leave button is visible on mobile as a floating red button.
- Waiting/alert colors: active red, resolved green.

SQL required:
Run OmideNo7_REALTIME_PERSISTENCE_SQL_PATCH.sql once in Supabase SQL Editor.

Important:
This is realtime control-state sync, not real audio/video media yet.
Real camera/audio between devices still requires LiveKit.
Version: 1.14.0-realtime-persistence-mobile-fix
