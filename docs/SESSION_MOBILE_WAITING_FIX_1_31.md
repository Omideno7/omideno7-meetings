# OmideNo7 Meetings 1.31.0

Fixes:
- LiveKit token service waits for Supabase session hydration and reads persisted auth token when Supabase getSession is delayed.
- Clear full-screen Login Session Expired state instead of confusing LiveKit error.
- Members with previous `removed` or `left` rows can re-enter Waiting Room instead of being bounced out.
- Mobile Permission/Templates pages no longer force horizontal dragging; layout stacks vertically.
- Mobile Live page stays scrollable and stable.

Important:
If the browser truly lost the Supabase auth session, the user must sign in again. LiveKit token generation cannot be secure without a real Supabase session.
