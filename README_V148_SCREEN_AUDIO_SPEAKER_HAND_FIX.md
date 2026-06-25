# OmideNo7 Meetings v1.48 — Screen Audio + Speaker + Hand Fix

This update is based on the working v1.47 build.

## Fixes
- Screen-share audio track is now rendered for remote participants.
- YouTube/worship audio should work when the host shares a Chrome Tab and enables “Share tab audio”.
- Speaker / audio output selector added inside Audio settings where the browser supports `selectAudioOutput` and `setSinkId`.
- Raised hand now has local optimistic state so the badge stays visible immediately after clicking.
- Raised hand also syncs through Supabase using the corrected `set_my_hand_raised(p_meeting_id, p_hand_raised)` RPC.

## Notes
- On macOS, YouTube audio normally requires sharing the Chrome Tab containing YouTube, not Entire Screen.
- On iPhone/Safari, speaker/earpiece switching is limited by the browser/OS. If unsupported, the app shows a message and the user must use device controls.
- Run `OmideNo7_V148_HAND_FIX_SQL.sql` only if the hand badge still flashes/disappears after deploy.

## Test URL
https://omideno7-meetings-r3hq.vercel.app/?v=v148-screen-audio-speaker-hand
