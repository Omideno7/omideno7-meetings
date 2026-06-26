# v1.69 Mobile Reaction Picker Portal

Focused fix only for the React/Reactions menu on mobile.

## What changed
- The reaction picker is no longer rendered inside the horizontally scrolling mobile toolbar.
- The picker is rendered as a fixed overlay/portal layer outside the toolbar, preventing iOS/Android from clipping it.
- Reaction buttons are visible and tappable on phones.
- Desktop behavior remains unchanged.
- LiveKit connection, mic, camera, screen share, waiting room, owner logic, permission templates, and recording marker were not changed.

## Test
Open Live Meeting on phone, tap React ✨, and confirm the reaction icons are visible above the bottom toolbar and tappable.
