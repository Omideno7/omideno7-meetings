# Step 22A — Request Access Fix

This patch ensures public Request Access submissions are saved into Supabase.

## Run SQL

Run:

```text
supabase/migrations/0022a_request_access_public_submit_fix.sql
```

This creates:

- public insert policy for `access_requests`
- owner select/update/delete policies
- `submit_access_request_public(...)` RPC fallback

## Test

1. Logout
2. Request Access
3. Submit a test request
4. Login as Owner
5. Open Approvals
6. Press Refresh Requests
