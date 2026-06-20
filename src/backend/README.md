# Backend README

This folder will contain the NestJS backend for OmideNo7 Meetings. It includes modules for:
- auth (signup, login, email verification)
- requests (access requests pending for owner)
- meetings (create, schedule, start, end)
- waiting-room (join, admit, reject)
- interpreters (assign, status)
- recordings (trigger/save metadata)

Current status: scaffold placeholder. Detailed implementation and files will be added in the next commits.

Run locally (planned):
- Use Docker Compose to run Postgres and the backend
- Use .env variables for connection strings and LiveKit keys

