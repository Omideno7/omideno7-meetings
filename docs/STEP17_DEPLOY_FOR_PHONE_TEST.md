# Step 17 — Deploy for Phone Test

To install the PWA on a phone, the app must be served over HTTPS.

Recommended test hosting options:

- Vercel
- Netlify
- GitHub Pages with correct Vite base config
- Cloudflare Pages

## Basic deploy flow

```bash
cd omideno7-meetings-react
npm install
npm run build
```

Then deploy the `dist/` folder.

## After deployment

Open the HTTPS URL on the phone and install it as PWA.

## iPhone note

iPhone uses Safari's Share → Add to Home Screen. The install button event is not always available like Android Chrome.
