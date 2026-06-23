# OmideNo7 Meetings — LiveKit Custom Grid Steps 421–470

Fixes:
- Removes visible "Real LiveKit Room" wording.
- Uses OmideNo7 Live Meeting wording.
- Stops using LiveKit VideoConference component as a separate room UI.
- Uses livekit-client directly.
- Creates one visual tile per LiveKit participant.
- If camera is on, tile shows live video.
- If camera is off, tile shows avatar/initial.
- Adds per-tab sessionStorage deviceId to prevent same-account duplicate connection conflicts.
- Host opens the room; members join only after waiting/admission.
- Members do not choose rooms manually.

Still pending:
- Host force mute via LiveKit server RoomService.
- Real recording/Egress.
- Advanced layouts for 30+ people.

Version:
1.19.0-livekit-custom-video-grid
