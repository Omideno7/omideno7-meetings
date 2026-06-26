# OmideNo7 Meetings — v1.67 Mobile Permission Template Cards

Purpose: keep the current stable Live/meeting behavior unchanged and only improve the Owner > Permission Templates page on mobile phones.

## What changed

- Added a mobile-only card editor for Permission Templates.
- On phones, the wide Editable Template Matrix table is hidden and replaced with stacked template cards.
- Each template card contains:
  - Template name
  - Role selector
  - All permission toggles as readable vertical rows
  - Save / Clone / Delete or Protected actions
- Desktop and laptop still use the existing full matrix table.
- iPad/tablet and desktop behavior are not changed except for minor form width safety.
- Service worker cache bumped to v1.67.

## What was intentionally not changed

- Live meeting connection behavior
- Admin/Owner/Member LiveKit token behavior
- Mic/camera/screen-share behavior
- Waiting room behavior
- Recording behavior
- Owner role logic

## Install

Upload the files from the mini patch to the root of the GitHub project, replacing existing files, then commit and wait for Vercel deploy.

Test URL:

https://omideno7-meetings-r3hq.vercel.app/?v=v167-permission-mobile

