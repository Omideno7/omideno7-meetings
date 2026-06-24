# OmideNo7 Meetings 1.40.0 — Safari Fresh Room Retry

This build is focused only on Safari signal connection failure after permission OK.

Confirmed from test:
- Safari loads latest code.
- Camera/mic permission is OK.
- Failure is LiveKit signaling: Abort handler called.

Fix:
- Creates a brand-new LiveKit Room object for every Safari retry.
- Requests a fresh token for every Safari retry.
- Removes prepareConnection from Safari path.
- Keeps conservative Safari room options:
  adaptiveStream=false, dynacast=false, simulcast=false, disconnectOnPageLeave=false.
- Retries Safari connect up to 4 times.

Test:
- Open /?v=140fresh
- Confirm banner: Build 1.40 Safari fresh-room retry is loaded
- Test Safari camera/mic first
- Press Enter live
