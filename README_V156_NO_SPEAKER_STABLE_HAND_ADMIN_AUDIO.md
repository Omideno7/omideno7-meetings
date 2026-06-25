# OmideNo7 Meetings v1.56 — No Speaker + Stable Hand + Admin Audio

Changes:
- Removed the non-functional speaker control from the meeting UI.
- Removed speaker overlay/indicator events.
- Updated visible meeting version to v1.56.
- Made local raised-hand display read from durable local storage + local state, so room refresh should not clear it.
- Kept member entry as a real user action: admitted members press Enter before joining Live.
- Strengthened admin microphone refresh after publishing audio so remote users receive the published mic track without needing to toggle their own mic first.

No SQL patch is required.
