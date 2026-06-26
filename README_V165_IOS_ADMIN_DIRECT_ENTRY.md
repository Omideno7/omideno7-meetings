# OmideNo7 Meetings v1.65 — iOS Admin Direct Entry + Diagnostics

Fix target:
- Admin/Host could connect on MacBook Chrome, but not on iPhone/iPad.
- Mobile users sometimes needed to open their own mic to hear the host.

Changes:
- Added a direct green mobile host entry button inside the LiveKit room area.
- Direct button calls LiveKit connect from inside the LiveKit component tap handler.
- Added visible mobile host Status/error line so failure reason is no longer hidden.
- iOS/iPadOS room setup uses a simpler first connection profile.
- Mobile token request sends `mobileSafe`; backend removes LiveKit `roomAdmin` from mobile tokens because app host controls use Supabase.
- Updated version and cache to v1.65.

Test:
1. Open on iPhone/iPad preferably in Safari.
2. Sign in as admin.
3. Press the top Enter/Open button.
4. If it does not connect, press the green `Start Live on this device` card inside the meeting area.
5. Read the visible Status line and send screenshot if it still fails.
