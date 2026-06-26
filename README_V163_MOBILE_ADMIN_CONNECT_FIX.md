# OmideNo7 Meetings v1.63 — Mobile Admin Connect Fix

This update focuses on Admin/Host connection reliability on phones and tablets.

## Fixes

- Mobile/tablet Host connection no longer waits for Supabase room bookkeeping before starting the LiveKit connection.
- The LiveKit enter event is dispatched immediately from the user tap flow and repeated once safely.
- Mobile Host connection uses a mobile-friendly Room configuration: adaptiveStream and dynacast disabled for the connect path.
- Explicit connection timeout and automatic mobile retry were added.
- Successful connection is now also confirmed after `room.connect()` resolves, not only by the Connected event.
- Parent page clears the Entering/Opening state on success or failure.
- Version label updated to v1.63.
- Service Worker cache name updated to force fresh app code.
- Name overlay uses a new small `namechip` class so old black namebar CSS cannot override it.

## Mobile Host behavior

- Desktop/laptop Host: auto microphone remains enabled.
- Phone/tablet Host: connection starts first; Host taps Mic manually after connected.

## Test URL

https://omideno7-meetings-r3hq.vercel.app/?v=v163-mobile-admin
