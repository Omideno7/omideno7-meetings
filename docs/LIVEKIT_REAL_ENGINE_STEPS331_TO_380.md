# OmideNo7 Meetings — LiveKit Real Engine Phase 1 Steps 331–380

This is the first real LiveKit integration.

Added:
- Vercel serverless endpoint: /api/livekit/token
- Secure server token generation with livekit-server-sdk
- Supabase session verification before token generation
- Approved profile required
- Members must be admitted in Waiting Room before receiving LiveKit token
- Host roles can get token directly
- Device-specific identity so the same account can test from phone and laptop without LiveKit disconnecting the first device
- React LiveKit UI with LiveKitRoom and VideoConference
- Join Real Room / Close Real Room controls
- Real camera/microphone LiveKit UI inside Live Meeting page

Required Vercel Environment Variables:
- LIVEKIT_URL
- LIVEKIT_API_KEY
- LIVEKIT_API_SECRET
- VITE_LIVEKIT_WS_URL
- VITE_LIVEKIT_ENABLED=true

Optional:
- VITE_LIVEKIT_TOKEN_ENDPOINT=/api/livekit/token
- VITE_LIVEKIT_DEFAULT_ROOM=omideno7-main-room

Version:
1.17.0-livekit-real-engine-phase1

Notes:
- This adds real audio/video.
- Recording/Egress is not included yet.
- Host force-mute via LiveKit server RoomService will be a later phase.
