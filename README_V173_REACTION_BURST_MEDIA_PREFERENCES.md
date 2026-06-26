# OmideNo7 Meetings v1.73 — Reaction Burst + Saved Media Preferences

این پچ فقط برای دو بخش است و به Supabase SQL، Auth، Owner Panel، Waiting Room یا ساختار LiveKit Token دست نمی‌زند.

## 1) Emoji / Reactions

- هر بار کلیک روی یک emoji، بین 7 تا 15 اموجی کوچک روی کل صفحه پخش می‌کند.
- اموجی‌ها از پایین صفحه به سمت بالا حرکت می‌کنند و محو می‌شوند.
- روی موبایل، تبلت و لپ‌تاپ کار می‌کند.
- برای جلوگیری از شلوغی، نام فرستنده فقط روی یکی از اموجی‌های burst نمایش داده می‌شود.

## 2) ذخیره تنظیمات Media

تنظیمات زیر در localStorage ذخیره می‌شوند و Live Meeting از همان‌ها استفاده می‌کند:

- Camera / External webcam
- Phone camera side: Auto / Front camera / Back camera
- Microphone / External mic
- Speaker / Headphones
- Video quality
- Noise suppression
- Echo cancellation
- Auto gain
- Mic mode
- Background preview preference

## روش آپلود

فقط فایل‌های داخل این patch را در همان مسیرهای پروژه جایگزین کن. نیازی نیست کل پروژه را دوباره آپلود کنی.

## تست انجام‌شده

```bash
npm run build
```

نتیجه: Build موفق بود. فقط هشدار معمول Vite درباره بزرگ بودن chunk نمایش داده شد که خطا نیست.
