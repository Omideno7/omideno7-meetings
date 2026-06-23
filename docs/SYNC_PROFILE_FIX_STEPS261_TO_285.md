# OmideNo7 Meetings — Sync/Profile Fix Steps 261–285

Fixes:
- Participant tile click no longer opens broken half-popup.
- Participant actions moved into the right Attendees panel.
- Host can select a participant in the right panel and use:
  - Message
  - Move room
  - Toggle mic
  - Kick / remove from meeting
  - Block in meeting
- Stable participant row IDs added for better cross-device sync.
- Host mic/camera/hand control state is applied to the member’s own device state when refreshed/realtime event arrives.
- Admitted waiting users remain in meeting participants.
- Profile page is rebuilt to be mobile-safe with no horizontal scrolling.
- Avatar/profile photo persistence is improved through profiles.avatar_url and local fallback.
- SQL patch: OmideNo7_SYNC_PROFILE_FIX_SQL_PATCH.sql
- Version: 1.15.0-sync-profile-participant-fix
