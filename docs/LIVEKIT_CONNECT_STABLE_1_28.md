# OmideNo7 Meetings 1.28.0 — LiveKit Connect Stable

Fixes the regression introduced after the clean live page rebuild:
- Removes the custom timeout wrapper around room.connect that could trigger "Abort handler called".
- Makes Enter Live an explicit user action.
- Prevents host start click from being swallowed by confirmBeforeStart state.
- Keeps the clean full-width Live page layout from 1.27.
- Camera/mic remain OFF by default.
