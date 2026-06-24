# OmideNo7 Meetings 1.35.0 — Safari Permission Test

Focus:
- Add explicit Safari camera/microphone permission test button inside LiveKit panel.
- Request audio+video from Safari before LiveKit signaling.
- If Safari has blocked the site, show clear permission instructions instead of only signal error.
- Add Vercel Permissions-Policy header for camera/microphone/display-capture/autoplay.
- Keep the last visible stable Live page.

Important:
If Safari does not show a permission popup even after pressing "Test Safari camera/mic", this is a browser/site permission state outside app code:
Safari > Settings > Websites > Camera/Microphone must be set to Ask or Allow for the domain.
