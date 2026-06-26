# v1.70 Reaction Float + Screen Share + Mobile Frame

Focused patch from v1.69.

## What changed
- Restored floating reactions: only the emoji/icon rises from the bottom; user names are no longer shown in the floating effect.
- Kept the mobile reaction picker portal from v1.69.
- Made screen share toggle more stable by using the real local screen-share publication state instead of stale button state.
- Simplified screen-share options for iOS/Safari and kept audio/system-audio options for Chrome-like desktop browsers.
- Added a screen-share operation guard so repeated taps do not create a stuck state.
- Added mobile/tablet safe-area layout overrides so the live room does not sit under the phone status bar and the toolbar remains reachable.

## Not changed
- Login/Auth flow
- Owner/servant permissions
- Waiting room
- Microphone/camera logic
- Permission Templates cards
- Recording marker

## Test
1. Enter Live on phone and tablet.
2. Tap React and send Heart/Like/Amen/Birthday. The icon should float upward without a name label.
3. Tap Share from a host device and verify start/stop without leaving the meeting.
4. Confirm the mobile live room is inside the visible safe frame and controls are reachable.
