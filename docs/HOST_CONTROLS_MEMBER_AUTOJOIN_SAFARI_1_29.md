# OmideNo7 Meetings 1.29.0

Adds:
- Host participant controls: allow mic, lock mic, mute, stop camera, ask camera, remove.
- Chat modes: public, host-only, closed.
- Member auto-join after host admission.
- Member raise hand button, with hand badge on participant tile.
- Audio output button where browser supports setSinkId.
- Safari/iOS compatibility notice and connection cleanup.
- Keeps clean full-width Live page from 1.27 and stable connection from 1.28.

Notes:
- Hosts cannot force a participant microphone/camera ON without user consent because browsers require user permission.
- Host can mute/lock mic and stop camera; participants must voluntarily enable camera/mic when allowed.
