# OmideNo7 Meetings 1.23.0

Focus:
- LiveKit Room.connect has a hard 20s timeout.
- Shows precise error if WebSocket connection cannot be reached.
- Removes fake fallback participant tiles to stop fake camera/mic/equalizer confusion.
- Equalizer is only shown from real LiveKit audioLevel.
- Member waiting/live flow is more stable and should not bounce home unless removed by host.
- Profile save now closes back to Home after pressing Save Profile.
- Mobile grid is smaller and cleaner.
- /api/livekit/debug now shows livekitUrlHost and whether URL starts with wss://.
