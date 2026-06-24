# OmideNo7 Meetings 1.38.0

Fix for failed Vercel deployment from 1.37:
- Does not change LiveKit dependency versions.
- Keeps existing package dependency graph stable.
- Adds cache/service worker bypass.
- Adds visible banner: Build 1.38 Safari cache-bypass is loaded.
- Adds visible Safari camera/mic permission test card in Live Meeting page.
- Adds Permissions-Policy header.

Test:
1. Open /version.json?v=138.
2. Confirm version 1.38.0.
3. Open /?v=138cache.
4. Live page must show the Build 1.38 banner and Safari camera/mic test card.
