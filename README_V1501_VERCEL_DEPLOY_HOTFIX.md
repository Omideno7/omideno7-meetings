# OmideNo7 Meetings v1.50.1 — Vercel Deploy Hotfix

This patch fixes Vercel deployment failure caused by package-lock.json pointing to an internal package registry URL.

Files:
- .npmrc
- package-lock.json
- package.json

Upload these files to the repository root and commit. Then redeploy in Vercel.

The app code is not changed in this hotfix.
