# Step 16B — Vite + React + TypeScript Conversion Starter

This build starts the real production conversion.

## What changed

A new production app was created in:

```text
omideno7-meetings-react/
```

The old prototype is preserved in:

```text
legacy-prototype/
```

## New stack

- Vite
- React
- TypeScript
- Supabase client dependency placeholder
- LiveKit client dependency placeholder
- Typed roles
- Typed routes
- Route guard service
- AppState context
- Owner / Member / Pending demo flows

## Locked rules preserved

- App uses `Apostle Yuhana`.
- Public users cannot see protected pages.
- Pending users stay Pending Approval.
- Owner-only pages require Owner role.
- Emergency Lockdown is Owner-only.
- Waiting Room is required before LiveKit token.
- Mic and camera are off by default.
- LiveKit token is server-side only.
- Recordings are private by default.
- Reports exclude private prayer requests and messages.

## How to run later

```bash
cd omideno7-meetings-react
npm install
npm run dev
```

Real npm installation is not included inside the zip.
