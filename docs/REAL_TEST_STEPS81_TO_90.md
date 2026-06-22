# OmideNo7 Meetings — Real Test Steps 81–90

Fixes:
- Audio/Video device selectors are now at the top and always visible
- User must press Allow / Refresh Devices so browsers reveal camera/mic labels
- Camera, microphone, speaker selectors are clear
- Reaction buttons now insert the actual emoji/symbol in chat
- Chat emoji toolbar is visible above the message input
- Test Meeting shortcut added to Home for servant practice sessions
- LiveKit-ready config scaffold added:
  - VITE_LIVEKIT_WS_URL
  - VITE_LIVEKIT_TOKEN_ENDPOINT
  - VITE_LIVEKIT_DEFAULT_ROOM

Next real phase:
- Add backend token endpoint
- Add LiveKit SDK
- Connect real audio/video rooms
- Store chat and participant state in backend
