# OmideNo7 Meetings 1.25.0

Fix:
- Prevents stale localStorage profile from being trusted in Supabase mode.
- If Supabase Auth session is missing, app clears cached profile and asks user to sign in again.
- Fixes LiveKit "Auth session missing" caused by old PWA/cache profile without real Supabase session.
- Bumps service worker cache to v25.
- Improves readability of LiveKit error card on mobile.
