# OmideNo7 Meetings v1.50 — Mobile Live Room Polish

Focused follow-up after v1.49 testing.

## Changes
- Mobile live room layout redesigned to be full-screen and cleaner.
- Technical/diagnostic text is hidden from participant view.
- Internal LiveKit control header is hidden; bottom toolbar becomes the primary meeting control bar.
- Added bottom Enter button so hosts/members can enter live after hiding internal controls.
- Top bar shows only app/church identity, version, connection state, and temporary action status.
- Mobile side panels open as a bottom sheet above the toolbar.
- Speaker button remains small in the bottom toolbar.
- Mic toggle includes an extra permission/pre-warm and retry step to reduce the host microphone not publishing until another user speaks.
- Screen share errors are now generic and do not expose underlying provider names.

## Recording
Real saved recording is not implemented by CSS/frontend changes. It requires LiveKit Egress + storage + a secure backend API. The current record button remains only a marker/timer until the Egress backend is built.
