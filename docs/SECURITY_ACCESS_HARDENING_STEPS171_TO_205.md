# OmideNo7 Meetings — Security / Access Hardening Steps 171–205

This build fixes the critical approval and member-access issues reported by Apostle Yuhana.

App fixes:
- Pending users can no longer enter Home / Waiting Room / Live Meeting just because the default role is approved_member.
- Route Guard now requires `status = approved` for every internal page.
- Top navigation only shows pages the current role/status may open.
- Member accounts cannot see host-only Waiting Room management.
- Member accounts cannot Admit / Reject waiting users.
- Member accounts cannot end the whole meeting.
- End Meeting button appears only for authorized host roles.
- Waiting Room management is host/Door Servant only.
- Meeting create/edit/delete is host-only.
- Mic controls are host-only.
- Participant microphone quick-toggle appears only for authorized hosts.
- Profile avatar now appears on the user’s main meeting tile.
- Participant grid can be changed: Compact / Normal / Large.
- Raise hand remains visible on the main tile and attendee list.

SQL patch required:
- Run `OmideNo7_SECURITY_ACCESS_HARDENING_SQL_PATCH.sql` once in Supabase SQL Editor.
- It updates approval sync logic so approving an access request updates the real profile row.
- It adds `sync_my_profile_from_access_request()` so a user can refresh after approval.
- It repairs existing approved requests by matching email to profile.

Version:
1.11.0-security-access-hardening
