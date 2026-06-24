# OmideNo7 Meetings 1.39.0 — Safari Signal Fix

Focus:
- Use LiveKit client 2.18.2 to satisfy peer dependency requirements.
- Add .npmrc legacy-peer-deps=true to prevent Vercel ERESOLVE.
- Keep visible Safari camera/mic test from 1.38.
- Conservative Safari room options:
  - adaptiveStream=false
  - dynacast=false
  - disconnectOnPageLeave=false
  - simulcast=false for publish defaults
- Prepare connection when available.
- Retry Safari connection up to 3 times.

If Chrome works and Safari permission test is OK but signaling still fails:
- This is likely WebKit/LiveKit Cloud signaling/network behavior.
- Close duplicate tabs and installed web app windows.
- Disable iCloud Private Relay/VPN for test.
- Test on Wi-Fi and LTE separately.
