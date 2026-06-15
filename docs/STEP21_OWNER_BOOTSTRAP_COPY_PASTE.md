# Owner Bootstrap Copy/Paste

After Apostle Yuhana creates an account in the app, run this in Supabase SQL Editor:

```sql
select public.bootstrap_owner_by_email('YOUR_EMAIL_HERE');
```

Replace `YOUR_EMAIL_HERE` with the exact email used to create the account.

Example:

```sql
select public.bootstrap_owner_by_email('apostle@example.com');
```
