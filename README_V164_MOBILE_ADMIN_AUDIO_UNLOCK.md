# OmideNo7 Meetings v1.64 — Mobile Admin + Audio Unlock

Purpose: fix two mobile/tablet live-room problems:

1. Admin/Host could enter Live on laptop, but mobile/tablet Enter did not reliably connect.
2. Members sometimes had to turn on their own microphone before they could hear the admin/host audio.

## Changes

- Added a direct `enterSignal` prop from `LiveMeetingPage` to `RealLiveKitRoom` so Enter is not dependent only on a window event listener.
- Fixed stale LiveKit control listener dependencies so mobile host/member Enter uses current profile/admission state.
- Added mobile audio unlock priming on Enter click/tap.
- Added silent audio + AudioContext unlock helper before entering Live.
- Added `unlock-audio` control event and repeated `room.startAudio()` / audio element play retries.
- Added LiveKit AudioPlaybackStatusChanged handling.
- Restored adaptiveStream/dynacast on mobile for more reliable LiveKit Cloud behavior.
- Added safe `deviceId` fallback for mobile browsers without `crypto.randomUUID()` or sessionStorage.
- Added Supabase session refresh retry before LiveKit token request.
- Updated visible Live Room version to v1.64.
- Updated PWA service worker cache name to force refresh.

## Test plan

1. Deploy the mini patch.
2. Open with cache buster:
   https://omideno7-meetings-r3hq.vercel.app/?v=v164-mobile-admin-audio
3. On mobile/tablet, sign in as admin.
4. Tap Enter once. The button should show feedback and Live should connect.
5. After admin connects on mobile, tap Mic manually to speak.
6. On a member phone, tap Enter. The member should hear admin audio without opening the member microphone.

## Important note

On iPhone/iPad, Chrome uses iOS WebKit under the hood. Audio playback still requires a real user tap. This version uses the Enter tap to unlock playback, but if a specific iOS browser still blocks audio, the user may need to tap Enter/Audio once more after connection.
