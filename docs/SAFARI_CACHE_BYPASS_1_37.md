# OmideNo7 Meetings 1.37.0 — Safari Cache Bypass

Temporary test build.

Purpose:
- Prove Safari is loading the latest app bundle.
- Disable service-worker caching.
- Clear Cache Storage on app startup.
- Show visible banner: "Build 1.37 Safari cache-bypass is loaded".
- Show visible "Safari camera/mic test" card before the LiveKit room.

Test:
1. Open /version.json?v=137 in Safari.
2. Open /?v=137cache in Safari.
3. Live page must show the 1.37 banner and Safari camera/mic test card.
4. Press Test Safari camera/mic before Enter live.
