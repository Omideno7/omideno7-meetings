# OmideNo7 Meetings v1.49 — Mobile UI + Media Controls

This update improves the live meeting UI on mobile and hides technical infrastructure labels from members.

## Main changes
- Mobile live room is redesigned to use the full phone screen more professionally.
- Internal technical names are hidden from the user; the UI shows only Connected/Ready/Waiting and short action feedback.
- Long helper text inside the live room is removed.
- Bottom toolbar is compact and horizontally scrollable on phone.
- Small speaker button added to the toolbar.
- Share screen is hidden for ordinary members unless host allows it.
- Host three-dot attendee menu can allow/disable screen sharing for a participant.
- Screen-share audio subscription is improved for Chrome tab audio.
- Microphone starts audio context before enabling mic, which helps mobile/browser audio activation.
- Profile page removes unnecessary extra testing/support shortcuts.

## Important limits
- YouTube audio works only when sharing a Chrome tab and choosing Share tab audio. Entire Screen on macOS/iPhone usually does not send system audio.
- Real saved cloud recording still requires a separate LiveKit Egress/storage backend. The in-room REC button is a marker/timer until that backend is added.

## SQL
Run `OmideNo7_V149_UI_MEDIA_SQL_PATCH.sql` only if allowed screen-share or hand raise does not persist.
