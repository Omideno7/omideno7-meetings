# OmideNo7 Meetings v1.52 — Speaker Indicator + Square Mobile Grid + Hand Stability

Changes:
- Speaker button now shows a small active speaker badge on the live stage when enabled.
- Speaker toolbar icon changes between inactive/active state.
- Mobile participant tiles are compact square cards using a 3-column grid.
- Camera/profile tiles use square layout so more participants fit on phone screen.
- Raise Hand local state is held strongly so the badge does not disappear during refresh.
- No SQL changes are required for this patch if v1.47/v1.48 SQL is already applied.

Recording note:
The Record button is still a marker/timer only. Real stored recordings require LiveKit Egress + storage + secure backend API.
