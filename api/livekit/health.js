import { AccessToken } from "livekit-server-sdk";

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function hostOf(value) {
  try { return new URL(value).host; } catch { return value ? "invalid-url" : ""; }
}

export default async function handler(req, res) {
  const wsUrl = (process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_WS_URL || "").trim();
  const apiKey = process.env.LIVEKIT_API_KEY || "";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "";
  let tokenCreated = false;
  let tokenError = "";

  try {
    if (apiKey && apiSecret) {
      const token = new AccessToken(apiKey, apiSecret, {
        identity: `health-check-${Date.now()}`,
        name: "OmideNo7 Health Check",
        ttl: "5m"
      });
      token.addGrant({ room: "omideno7-main-room", roomJoin: true, canPublish: false, canSubscribe: true });
      await token.toJwt();
      tokenCreated = true;
    }
  } catch (error) {
    tokenError = error?.message || "Token create failed";
  }

  return json(res, 200, {
    ok: true,
    livekitUrl: Boolean(wsUrl),
    livekitUrlHost: hostOf(wsUrl),
    livekitUrlStartsWithWss: wsUrl.startsWith("wss://"),
    livekitApiKey: Boolean(apiKey),
    livekitApiSecret: Boolean(apiSecret),
    tokenCreated,
    tokenError,
    supabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    supabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
    time: new Date().toISOString()
  });
}
