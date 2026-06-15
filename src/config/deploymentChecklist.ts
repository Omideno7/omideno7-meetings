export const deploymentChecklist = [
  {
    title: "Build locally",
    items: ["npm install", "npm run build", "npm run preview"]
  },
  {
    title: "Deploy to HTTPS",
    items: ["Vercel", "Netlify", "GitHub Pages", "Cloudflare Pages"]
  },
  {
    title: "PWA verification",
    items: [
      "manifest.webmanifest loads",
      "sw.js registers",
      "offline.html works",
      "icons display",
      "iPhone Add to Home Screen works",
      "Android Install App works"
    ]
  },
  {
    title: "Do not test as production",
    items: [
      "Supabase Auth is not connected yet",
      "LiveKit is not connected yet",
      "Push notifications are not connected yet",
      "Use this only for UI/navigation/install testing"
    ]
  }
];
