# OmideNo7 Meetings 1.30.0 — Auth Session Recovery

Fixes 'Auth session missing' when entering LiveKit after deployment or stale browser state.

Changes:
- LiveKit token service tries Supabase refreshSession() before failing.
- If session is truly missing, stale local profile data is removed.
- App receives an `omide-auth-session-missing` event and routes user back to Login.
- Auth session guard also tries refreshSession() before clearing profile.

Important:
If the browser already lost the Supabase session, the user must sign in once again.
After that, LiveKit token generation should work normally.
