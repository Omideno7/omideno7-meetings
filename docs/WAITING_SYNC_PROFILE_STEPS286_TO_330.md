# OmideNo7 Meetings — Waiting Sync/Profile Steps 286–330

Fixes:
- Member cannot enter Live Meeting directly anymore.
- Member sees Waiting Room gate and must enter waiting first.
- Host sees real waiting users from meeting_room_participants.
- Admit changes status from waiting to online; member remains in the meeting.
- Removed participants are marked status=removed.
- Participant actions now appear in right Attendees panel, not broken card popup.
- Profile settings stored in new profile_settings table via RPC.
- Mobile bottom nav removes duplicate Media button.
- Profile page is mobile-safe.
- New SQL patch: OmideNo7_WAITING_SYNC_PROFILE_SQL_PATCH.sql
- Version: 1.16.0-waiting-sync-profile-rebuild
