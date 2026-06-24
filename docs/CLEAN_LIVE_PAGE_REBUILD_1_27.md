# OmideNo7 Meetings 1.27.0 — Clean Live Page Rebuild

This version removes the old Live Meeting page grid/participant-card layout that was squeezing LiveKit into a narrow column.

Main fixes:
- Live page rebuilt from scratch with a simple full-width stage.
- Right panel is closed by default.
- Panel opens only when Host/Member taps Chat, Waiting, or Attendees.
- LiveKit is placed inside `.clean-stage`, not the old participants grid.
- Host can open meeting; members remain in Waiting Room until admitted.
- End all calls the existing backend RPC and clears chat through service fallback.
- Keeps LiveKit token/debug/health and Supabase auth-session guard.
