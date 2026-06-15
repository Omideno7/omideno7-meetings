# Step 16B — Conversion Map

## Prototype to React mapping

| Prototype concept | React location |
|---|---|
| Legacy nav/routes | `src/config/routes.ts` |
| Role guard | `src/services/routeGuard.ts` |
| Owner dashboard | `src/pages/OwnerDashboardPage.tsx` |
| Member home | `src/pages/MemberHomePage.tsx` |
| Login | `src/pages/LoginPage.tsx` |
| Request Access | `src/pages/RequestAccessPage.tsx` |
| Owner approvals | `src/pages/ApprovalsPage.tsx` |
| Waiting Room | `src/pages/WaitingRoomPage.tsx` |
| Live Meeting | `src/pages/LiveMeetingPage.tsx` |
| Simple remaining pages | `src/pages/SimplePages.tsx` |

## Next conversion task

Split `SimplePages.tsx` into complete feature pages one by one.
