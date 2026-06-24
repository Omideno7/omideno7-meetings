# OmideNo7 Meetings 1.41.0 — Safari SDK Native Retry

This build changes the Safari connection strategy:
- Uses LiveKit RoomConnectOptions:
  - maxRetries: 6
  - websocketTimeout: 60000
  - peerConnectionTimeout: 60000
- Removes manual fresh-room retry loop.
- Keeps Safari conservative Room options.
- Keeps visible permission test and cache bypass.

LiveKit docs define RoomConnectOptions with:
autoSubscribe, maxRetries, peerConnectionTimeout, rtcConfig, websocketTimeout.
