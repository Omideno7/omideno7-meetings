function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  return json(res, 200, {
    ok: true,
    livekitUrl: Boolean(process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_WS_URL),
    livekitApiKey: Boolean(process.env.LIVEKIT_API_KEY),
    livekitApiSecret: Boolean(process.env.LIVEKIT_API_SECRET),
    supabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    supabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
    time: new Date().toISOString()
  });
}
