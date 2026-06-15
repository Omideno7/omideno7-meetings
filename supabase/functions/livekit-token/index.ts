// OmideNo7 Meetings — LiveKit Token Edge Function Placeholder
// This must run server-side only. Never generate LiveKit tokens in frontend.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // TODO Step 25:
  // 1. Validate Supabase JWT.
  // 2. Load profile.
  // 3. Confirm status approved.
  // 4. Confirm waiting_room_entries.status = admitted.
  // 5. Generate LiveKit access token using server-only LIVEKIT_API_KEY and LIVEKIT_API_SECRET.
  // 6. Return token.

  return new Response(JSON.stringify({
    ok: false,
    message: "LiveKit token endpoint placeholder. Implement server-side token generation in Step 25."
  }), {
    status: 501,
    headers: { "Content-Type": "application/json" }
  });
});
