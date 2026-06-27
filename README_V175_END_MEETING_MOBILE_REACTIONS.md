# OmideNo7 Meetings v1.75 — End Meeting Sync + Mobile Connect + Reaction Rise Fix

این پچ فقط فایل‌های تغییرکرده را دارد و لازم نیست کل پروژه دوباره آپلود شود.

## تغییرات اصلی

### 1) End meeting for everyone
مشکل قبلی این بود که صفحه‌های دیگر ادمین/هاست می‌توانستند با refresh خودکار دوباره `live_open=true` کنند یا از LiveKit قطع نشوند. در این نسخه:

- Host boot دیگر جلسه را خودکار باز نمی‌کند.
- جلسه فقط با دکمه `Open & enter live` باز می‌شود.
- وقتی Owner/Host گزینه پایان جلسه برای همه را می‌زند، دستگاه‌های دیگر هم با sync وضعیت جلسه disconnect می‌شوند.
- اگر کاربر removed/blocked شود، اتصال LiveKit او هم قطع می‌شود.

### 2) Phone/mobile connection
برای گوشی و تبلت:

- زمان درخواست token در موبایل بیشتر شد.
- timeout اتصال موبایل بیشتر شد.
- retry مخصوص موبایل اضافه شد، نه فقط برای host.
- پیام خطای موبایل واضح‌تر شد.

### 3) Emoji/Reactions
مشکل اصلی این بود که در CSS قبلی `transform: ... !important` باعث می‌شد keyframe نتواند اموجی را به بالا حرکت بدهد. در این نسخه:

- `transform` از حالت important خارج شد.
- keyframe جدید v1.75 اضافه شد.
- اموجی‌ها از پایین صفحه به بالا حرکت واقعی دارند.
- نام شخص فقط کنار بعضی از اموجی‌ها می‌آید، نه کنار همه.

### 4) Screen share audio note
کد app همچنان برای مرورگرهای سازگار audio را درخواست می‌کند، اما Safari/iPhone/iPad معمولاً tab/system audio را به WebRTC نمی‌دهند. برای پخش ویدئو با صدا در جلسه، بهترین حالت Chrome یا Edge روی laptop/desktop است و باید `Browser Tab / Chrome Tab` + `Share tab audio` انتخاب شود.

## فایل‌هایی که باید جایگزین شوند

```text
src/pages/LiveMeetingPage.tsx
src/styles/global.css
src/components/livekit/RealLiveKitRoom.tsx
src/services/liveKitTokenService.ts
public/version.json
package.json
package-lock.json
```

فایل‌های عملکردی اصلی:

```text
src/pages/LiveMeetingPage.tsx
src/styles/global.css
src/components/livekit/RealLiveKitRoom.tsx
src/services/liveKitTokenService.ts
```

`package.json`, `package-lock.json`, و `public/version.json` برای شماره نسخه هستند.

## بعد از جایگزینی

```bash
npm install
npm run build
```

Build روی این نسخه تست شد و موفق بود. فقط هشدار معمول Vite درباره chunk بزرگ دیده شد که خطا نیست.
