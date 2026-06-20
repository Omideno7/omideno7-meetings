# PR Draft: Initial scaffold and MVP backend + web PoC

این Pull Request تغییرات اولیه برای راه‌اندازی پروژه OmideNo7 Meetings را جمع‌بندی می‌کند. هدف این PR فراهم کردن یک scaffold کامل برای:

- طراحی (design tokens، لوگوها)
- Backend (NestJS) با ماژول‌های: Requests, Meetings, Waiting, LiveKit
- Prisma schema و اسکریپت‌های migration/seed
- Web (React + Vite) صفحات پایه: Home, RequestAccess, PendingApproval, WaitingRoom
- Docker Compose مثال برای توسعه محلی

---

## تغییرات اصلی

1. افزودن scaffold طراحی: `src/design/*` (لوگوها و tokens)
2. افزودن backend scaffold: `backend/` شامل ماژول‌ها، Prisma schema، اسکریپت‌های migrate و seed
3. افزودن web scaffold: `web/` شامل صفحات React و تنظیمات Vite (proxy برای `/api`)
4. افزودن `docker-compose.yml` و `.env.example` برای توسعهٔ محلی
5. افزودن مستندات اولیه: `docs/DEPLOYMENT.md`, `docs/API.md`, `docs/PR_CHECKLIST.md`

---

## چک‌لیست تست محلی (قبل از merge)

- [ ] کلون repo و checkout به `initial-setup`
- [ ] `cp .env.example .env` و بررسی مقادیر
- [ ] `docker-compose up --build` اجرا و اطمینان از بالا آمدن Postgres و backend
- [ ] در مسیر `backend/` اجرای `./scripts/migrate.sh` (یا `npx prisma migrate dev --name init`) برای ایجاد جداول
- [ ] بررسی اینکه درخواست‌ها با `POST /api/requests` ذخیره می‌شوند و با `GET /api/requests/pending` قابل خواندن‌اند
- [ ] اجرای وب: `cd web && npm install && npm run dev` و بررسی فرم Request Access در `/`
- [ ] بررسی صفحات `/pending` و `/waiting` و عملکردهای پایه

---

## نکات امنیتی و قبل از deploy

- قبل از merge مقادیر زیر را در Settings → Secrets اضافه کنید:
  - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
  - `DATABASE_URL` (اگر از DB مدیریت‌شده استفاده می‌کنید)
  - (برای ضبط‌ها) `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
  - `JWT_SECRET` (در صورت نیاز)
  - `SMTP_API_KEY` یا کلید SendGrid برای ایمیل‌ها

---

## توضیحات تکمیلی

این PR یک PoC هسته‌ای است. پس از merge من ادامه می‌دهم و:
- ادغام Supabase Auth و owner-approval flow را اضافه می‌کنم
- پیاده‌سازی endpoint امن LiveKit token و PoC join در وب
- افزودن تست‌های e2e و CI workflows


