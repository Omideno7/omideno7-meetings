# OmideNo7 Meetings 1.20.0 — LiveKit UX Controls

Changes:
- LiveKit mic/camera default off after entering room.
- Mic/camera toolbar controls now control the real LiveKit room when connected.
- Participant tile shows green border when mic is open.
- Tile shows animated audio level bars when participant is speaking.
- Member enters live room automatically after admission; no separate Join button needed.
- Host sees a simple "Enter live meeting?" prompt, then connects directly.
- Chat mode controls are now stored in Supabase `meeting_room_settings`.
- Chat closed/admin-only mode now syncs to members through realtime.
- Rooms tab hidden from ordinary members.
- Testing and Release removed from top navigation and owner shortcuts.

Required SQL:
Run `/mnt/data/OmideNo7_MEETINGS_ROOM_SETTINGS_CHAT_MODE_PATCH.sql` in the new Meetings Supabase project.
