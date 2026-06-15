// OmideNo7 Meetings — Recording Webhook Placeholder
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async () => {
  return new Response(JSON.stringify({
    ok: false,
    message: "Recording webhook placeholder. Connect LiveKit egress/webhook later."
  }), {
    status: 501,
    headers: { "Content-Type": "application/json" }
  });
});
