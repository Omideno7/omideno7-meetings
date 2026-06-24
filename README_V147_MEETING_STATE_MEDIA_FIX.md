# OmideNo7 Meetings v1.47 — Meeting State + Media Fix

This patch focuses on the issues found after v1.46 testing:

- Raise Hand persists through Supabase using `set_my_hand_raised` RPC.
- Hand badge shows on the participant tile and attendee row after refresh/realtime update.
- Profile display names and profile photos are refreshed from the `profiles` table for each participant.
- Chat mode uses host settings RPC and shows an error if Supabase does not save it.
- Host role controls use RPCs for co-host/member changes and now report if saving failed.
- Host mic permission uses RPC and reports if saving failed.
- Member Join buttons route to Waiting Room / request flow instead of direct Live entry.
- Profile page removes Audio/Video Test and Report Problem shortcuts.
- Live audio meter added beside the Audio button.
- Audio settings added: Music/keyboard mode, noise suppression, echo cancellation, auto gain.
- Share screen helper text clarifies Entire Screen / Window / Chrome Tab.

Important:
Run `OmideNo7_V147_SAFE_SQL_PATCH.sql` in Supabase SQL Editor before testing if hand raise, chat modes, co-host changes, or mic permission controls do not persist.

Recording:
The REC button is still a visible recording marker/timer. Real saved cloud recording requires LiveKit Egress/storage setup in a separate backend step.
