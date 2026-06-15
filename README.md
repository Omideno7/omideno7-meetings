# OmideNo7 Meetings — React Conversion Starter

This is Step 16B: the start of the real Vite + React + TypeScript conversion.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Demo login options

- Owner: Apostle Yuhana
- Approved Member
- Pending User

## Important

This is still a starter. Supabase and LiveKit are prepared but not connected to real production services yet.


## Step 17 — PWA Installable Test

This version includes PWA manifest, icons, service worker, offline page and Install App route.

To test locally:

```bash
npm install
npm run dev
```

For phone installation, deploy with HTTPS and open the URL on the phone.


## Step 18 — Deploy Test Version

Prepared deployment files:

- `vercel.json`
- `netlify.toml`
- `.github/workflows/deploy-github-pages.yml`

Recommended first deployment: Vercel or Netlify.

For phone testing, deploy to HTTPS, then install from Safari/Chrome.


## Step 19 — Functional Demo + Mobile UI Fix

The installed PWA now has working demo state for:

- request access
- owner approvals
- waiting room
- meeting controls
- notifications
- inbox
- media library
- reports
- checklists

This is localStorage demo behavior. Real backend integration comes later.

## Step 20 — Supabase Backend Foundation

Adds Supabase schema, RLS, storage setup, backend status page, and service files.


## Full Build Steps 21 to 30

This version includes the combined structure for Auth, Approvals, Roles, Meetings, LiveKit token placeholder, Recordings, Notifications, Reports, Testing Center and Release Readiness.
