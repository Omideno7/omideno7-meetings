# API Reference (initial)

This document lists the initial backend HTTP endpoints implemented in the scaffold. Endpoints are prefixed with `/api`.

Requests module
- POST /api/requests
  - Create an access request
  - Body: { fullName, email, phone?, country?, language?, reason }
  - Response: created AccessRequest record

- GET /api/requests/pending
  - Returns list of pending access requests

Meetings module
- POST /api/meetings
  - Create a meeting
  - Body: { title, ownerId, type, startTime?, endTime?, livekitRoom? }

- GET /api/meetings
  - List meetings

- GET /api/meetings/:id
  - Get meeting by id

Waiting module
- POST /api/waiting/join
  - Join waiting room for a meeting
  - Body: { meetingId, fullName, email, country? }

- GET /api/waiting/meeting/:meetingId
  - List waiting entries for a meeting (ordered by createdAt asc)

- POST /api/waiting/:id/admit
  - Mark waiting entry as admitted

- POST /api/waiting/:id/reject
  - Mark waiting entry as rejected

LiveKit
- POST /api/livekit/token
  - Create a LiveKit access token for a given room
  - Body: { room, identity? }
  - Note: LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in environment for this to work.

Notes
- Many endpoints require authentication in future (owner/admin actions like admit). For the MVP these endpoints are available without auth; I will add Supabase Auth integration next.
- Use `./backend/scripts/migrate.sh` to run Prisma migrations and seed data locally.
