# OmideNo7 Meetings 1.34.0 — Safari LiveKit Connection Fix

This update focuses only on Safari/iOS LiveKit connection stability.

Changes:
- Pins livekit-client to 2.18.1 instead of unpinned `latest`.
- Safari mode disables adaptiveStream and dynacast.
- Safari mode sets disconnectOnPageLeave=false.
- Safari mode requests microphone permission from the Enter Live user gesture before LiveKit negotiation.
- Safari mode calls prepareConnection() when available.
- Safari mode tries room.connect up to 3 times with a short backoff.
- Adds /api/livekit/safari diagnostic endpoint.

If Chrome works but Safari still fails, check:
- Safari website settings: Camera/Microphone allowed.
- iCloud Private Relay and VPN disabled for the test.
- Only one OmideNo7 tab open.
- Safari not in PWA/home-screen mode for first test.
