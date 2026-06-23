# OmideNo7 Meetings 1.21.0

Fixes:
- Explicit Vercel API rewrite for /api/livekit/token.
- LiveKit token request timeout + clearer error messages instead of staying on Opening forever.
- Owner Enter now calls connection directly.
- Profile photo is resized/compressed and immediately updated.
- Member Waiting Room has Back to Home.
- End meeting for everyone updates Supabase state and removes waiting/online participants.
- Members are redirected out when host ends the meeting.
- Mic frame effect is a real subtle green frame based on LiveKit participant audioLevel, not just a fake loop.
- Added /api/livekit/debug to check environment flags.

Test:
- Open https://omideno7-meetings-r3hq.vercel.app/api/livekit/debug
- All flags should be true.
