# OmideNo7 Meetings v1.54 — Hand Stability + iOS Plan

This patch fixes the remaining Raise Hand flicker by separating display state from participant refreshes.

- Hand state is now broadcast as a hidden room event through chat (`__hand__`).
- Hidden hand events are not displayed in the chat panel.
- The local user's hand uses local state first, so it does not blink when Supabase refreshes.
- Remote users receive the latest hand state from hidden room events and participant state.

No SQL is required for this patch if v1.47/v1.48 SQL was already installed.
