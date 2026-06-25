# OmideNo7 Meetings v1.51 — Mobile Icons + Mic Fix

This update continues from v1.50 and focuses on the exact issues reported:

- Bottom meeting controls are now compact icon buttons.
- Desktop hover labels are available through tooltip/label.
- Internal duplicate LiveKit control row inside the stage is hidden.
- Mobile live room allows vertical scroll instead of clipping the meeting content.
- Stage sizing was adjusted for phone screens.
- Admin microphone publishing is more robust with prewarm, retry, and actual publication check.
- Speaker button toggles default/selected speaker on supported desktop browsers and resumes audio on mobile browsers that do not expose output routing.

Notes:
- On iPhone/Safari, browsers generally do not allow a web app to force speaker/earpiece routing. The speaker icon can resume/unlock audio, but exact output routing remains device-controlled.
- Real cloud recording still requires LiveKit Egress + storage backend.
