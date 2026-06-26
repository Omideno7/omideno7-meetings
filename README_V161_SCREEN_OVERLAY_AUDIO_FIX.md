# OmideNo7 Meetings v1.61 — Screen Overlay + Share Audio Fix

Changes:

- Replaces the black participant name bar with a very small light name chip.
- Moves the screen-share presenter name to the top-left corner so subtitles at the bottom remain readable.
- Adds stronger remote audio playback retries when screen-share audio tracks arrive.
- Calls room audio unlock/startAudio after screen-share publish/subscription events.
- Updates visible Live Room version to v1.61.
- Bumps service worker cache name for clearer deployment refresh.

Important for YouTube audio:

- On Chrome desktop, use Share screen > Chrome Tab > choose YouTube tab > enable Share tab audio.
- If a viewer cannot hear it, they should tap/click once inside the meeting after entering; the app now retries audio playback automatically.
