# Step 17 — PWA Installable Test Build

This step prepares the React version to be installable as a test PWA.

## Added

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
- PWA icons: 72, 96, 128, 144, 152, 180, 192, 384, 512
- Maskable icon
- Apple mobile web app meta tags
- Theme color
- `pwaService.ts`
- `useInstallPrompt.ts`
- `InstallAppCard.tsx`
- `InstallAppPage.tsx`
- `Install App` route and landing button

## How to install on iPhone

1. Deploy the app to HTTPS hosting.
2. Open the link in Safari.
3. Tap Share.
4. Tap Add to Home Screen.
5. Confirm Add.

## How to install on Android

1. Deploy the app to HTTPS hosting.
2. Open the link in Chrome.
3. Tap the menu ⋮.
4. Tap Install app or Add to Home screen.
5. Confirm.

## Important

Live meetings, Supabase, LiveKit, push notifications and real authentication are not production-connected yet.
