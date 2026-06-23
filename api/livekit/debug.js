function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function hostOf(value) {
  try {
    return new URL(value).host;
  } catch {
    return value ? "invalid-url" : "";
  }
}

export default async function handler(req, res) {
  const wsUrl = (process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_WS_URL || "").trim();
  return json(res, 200, {
    ok: true,
    livekitUrl: Boolean(wsUrl),
    livekitUrlHost: hostOf(wsUrl),
    livekitUrlStartsWithWss: wsUrl.startsWith("wss://"),
    livekitApiKey: Boolean(process.env.LIVEKIT_API_KEY),
    livekitApiSecret: Boolean(process.env.LIVEKIT_API_SECRET),
    supabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    supabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
    time: new Date().toISOString()
  });
}
