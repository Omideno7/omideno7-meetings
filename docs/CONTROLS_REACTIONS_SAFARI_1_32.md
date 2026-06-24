# OmideNo7 Meetings 1.32.0

Fixes and additions:
- Service-layer chat enforcement. Members cannot send normal chat when chat mode is host-only or closed.
- Reaction system restored with floating reactions.
- Raise hand is visible for all online users and shows as a hand badge on participant tile.
- Camera-off tile shows profile avatar from LiveKit metadata when available, otherwise initials.
- Host attendee controls are cleaner: quick speaker/mute icon beside name, more controls under ⋯.
- Microphone and camera permission preflight added before enabling tracks.
- Safari/iOS LiveKit connection now retries with fresh device identity, disables adaptive/dynacast for Safari, and uses longer signaling timeout.
- Mobile layout remains stacked and scrollable.

Limitations:
- Browsers do not permit a host to turn a participant microphone/camera ON without the participant's consent. Host can mute, lock mic, stop camera, request camera, and allow mic access.
- If Safari still fails after these retries, check Safari permissions, iCloud Private Relay/VPN, and LiveKit Cloud region/network access.
