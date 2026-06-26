# OmideNo7 Meetings v1.62 — Mobile Host Compatibility + Enter Feedback

Changes:
- Mobile/tablet Host/Admin no longer auto-starts microphone after connecting. This avoids mobile browser permission/autoplay lockups.
- Desktop/laptop Host/Admin auto mic behavior remains.
- Host/Admin mobile flow: tap Enter/Open once, connect to Live, then tap Mic if needed.
- Enter/Open buttons now show visual feedback: green pulse, disabled state, and Entering/Opening label.
- Request to Join button now shows Request sent / Waiting / Admitted feedback.
- Live room version changed to v1.62.

Recommended test:
1. Host on laptop: enter live, confirm auto mic works.
2. Host on mobile/tablet: tap Enter/Open, confirm Live connects without hanging; then tap Mic.
3. Member on mobile: Request Join, confirm button shows Waiting, then after Admit tap Enter.
