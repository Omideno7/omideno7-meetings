# OmideNo7 Meetings v1.74 — Reaction Float + Screen Share Audio

این patch-only فقط فایل‌های لازم برای دو اصلاح را دارد:

1. Emoji/Reactions burst به شکل واقعی از پایین صفحه به بالا حرکت می‌کند.
2. Screen Share با گزینه‌ی audio فعال می‌شود و برای Chrome/Edge حالت tab audio را ترجیح می‌دهد.

## فایل‌های داخل پچ

```text
src/pages/LiveMeetingPage.tsx
src/styles/global.css
src/components/livekit/RealLiveKitRoom.tsx
public/version.json
package.json
package-lock.json
README_V174_REACTION_FLOAT_SCREEN_AUDIO.md
```

## نکته مهم درباره Screen Share Audio

کد برنامه حالا audio را برای screen share درخواست می‌کند، اما مرورگر باید واقعاً audio track بدهد. برای پخش صدای ویدیو در جلسه، بهترین حالت این است:

- با Chrome یا Edge روی laptop/desktop وارد جلسه شوید.
- ویدیو را در یک browser tab باز کنید.
- هنگام Share Screen گزینه‌ی Chrome Tab / Browser Tab را انتخاب کنید.
- گزینه‌ی Share tab audio را روشن کنید.

Safari، iPhone و iPad معمولاً صدای tab/system را برای screen share به WebRTC نمی‌دهند. در این حالت تصویر می‌آید ولی صدا نمی‌آید و برنامه پیام راهنما نشان می‌دهد.

## تست

Build موفق شد:

```bash
npm run build
```

هشدار Vite درباره chunk بزرگ خطا نیست.
