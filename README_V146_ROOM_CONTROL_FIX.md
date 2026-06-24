# OmideNo7 Meetings v1.46 — Room Control Fix

This patch focuses on the issues found after v1.45 testing:

- React menu is fixed above the bottom toolbar so the reaction buttons are reachable.
- Profile avatar loading is scoped per user so admin/member avatars do not overwrite each other.
- Host Open meeting now opens the room and immediately enters LiveKit without needing a member request first.
- Chat mode control is more stable and reports if Supabase did not save the change.
- Host microphone control uses a Supabase RPC when available, and participants auto-mute when mic permission is locked.
- Co-host/member role changes use a Supabase RPC when available.
- Screen share no longer forces the current browser tab; Chrome should show the native chooser for screen/window/tab.
- Recording marker now shows a timer and clarifies that real cloud recording still needs LiveKit Egress/storage setup.

Run `OmideNo7_V146_SAFE_SQL_PATCH.sql` only if chat mode, microphone lock, or co-host role changes still revert after deploy.
