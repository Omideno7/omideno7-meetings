# OmideNo7 Meetings v1.44 — Host controls, reactions, avatars, screen share

This update improves the stable v1.42/v1.43 LiveKit build:

- More visible worship reactions: heart, like, Amen, Hallelujah floating over the live grid.
- Raise hand is visible on participant tiles and in the right attendees panel.
- Waiting requests use a red warning badge.
- Alerts/toasts use red warning styling.
- Participant avatar/photo is shown in live tiles when camera is off.
- Host-only attendee controls in the right panel:
  - mic permission / lock-unlock unmute button
  - 3-dot menu
  - make co-host
  - change to member
  - remove from meeting
  - direct message
- Host chat control: open chat, servants/hosts only, closed.
- Direct message target selector for hosts.
- Screen share button added. In Chrome desktop, share a browser tab and tick “Share tab audio” when music/tab audio should be sent.

Deploy notes:
- Upload extracted files from the ZIP, not the ZIP itself.
- Vercel environment variables do not need to be changed.
- Run `OmideNo7_V144_SAFE_SQL_PATCH.sql` only if a missing column/RPC error appears.
