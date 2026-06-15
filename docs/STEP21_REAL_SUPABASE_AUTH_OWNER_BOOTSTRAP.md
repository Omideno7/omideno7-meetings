# Step 21 — Real Supabase Auth + Owner Bootstrap

This step adds real Supabase Auth support.

## Added

- Real Sign In form
- Real Create Account form
- Supabase Auth service
- Session/profile hydration
- Pending Approval screen refresh
- Request Access writes to Supabase when `VITE_DATA_MODE=supabase`
- SQL migration for automatic profile creation
- Owner bootstrap helper function

## Supabase SQL

Run:

```text
supabase/migrations/0021_auth_profile_trigger_owner_bootstrap.sql
```

## Owner setup order

1. Deploy this Step 21 package.
2. Open app.
3. Go to Login.
4. Choose Create Account.
5. Enter Apostle Yuhana name, email and password.
6. Submit.
7. Open Supabase SQL Editor.
8. Run:

```sql
select public.bootstrap_owner_by_email('YOUR_EMAIL_HERE');
```

9. Logout/login again.
10. The account should enter as Owner.

## Security

Never place service-role keys in frontend or GitHub.
