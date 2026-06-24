const LIVEKIT_URL = (process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_WS_URL || "").trim();
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  return json(res, 200, {
    ok: true,
    livekitUrlPresent: Boolean(LIVEKIT_URL),
    livekitUrlStartsWithWss: LIVEKIT_URL.startsWith("wss://"),
    livekitApiKeyPresent: Boolean(LIVEKIT_API_KEY),
    livekitApiSecretPresent: Boolean(LIVEKIT_API_SECRET),
    safariNote: "If this endpoint is OK and Chrome connects, Safari failure is client-side WebRTC/WebKit/network-permission related."
  });
}
