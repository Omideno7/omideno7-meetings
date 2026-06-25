# OmideNo7 Meetings v1.53 — Speaker indicator + hand badge fix

- Shows a persistent small speaker icon on the live stage when speaker mode is toggled on.
- Tapping the speaker icon or toolbar speaker button toggles the visual speaker state off again.
- Makes the raised-hand badge use a white background with the yellow hand emoji.
- Makes local raised-hand state sticky with localStorage so it does not disappear during refresh.
- Does not add real recording backend; LiveKit Egress/storage is still required for saved recordings.

Important about iPhone speaker routing:
Mobile Safari/iOS web apps do not provide a browser API to force audio between earpiece and loudspeaker. The app can resume/unlock audio and show a speaker state, but the operating system decides the actual output route unless this becomes a native iOS/Android app.
