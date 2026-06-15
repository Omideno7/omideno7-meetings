# Step 18 — Deploy Test Version

This step prepares OmideNo7 Meetings React PWA for HTTPS deployment.

## Best first choice

Use Vercel or Netlify for the first quick test.

## Local commands

```bash
cd omideno7-meetings-react
npm install
npm run build
npm run preview
```

## Vercel

Files prepared:

- `vercel.json`

Deploy settings:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

## Netlify

Files prepared:

- `netlify.toml`

Deploy settings:

- Build command: `npm run build`
- Publish directory: `dist`

## GitHub Pages

Files prepared:

- `.github/workflows/deploy-github-pages.yml`

Use only if the repository is prepared correctly and GitHub Pages is enabled.

## After deployment

Open the HTTPS link on your phone.

### iPhone

Safari → Share → Add to Home Screen

### Android

Chrome → menu ⋮ → Install app / Add to Home screen
