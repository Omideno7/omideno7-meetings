// OmideNo7 Meetings — Owner Broadcast Edge Function Placeholder
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async () => {
  return new Response(JSON.stringify({
    ok: false,
    message: "Owner broadcast placeholder. Use Supabase service role server-side only in production."
  }), {
    status: 501,
    headers: { "Content-Type": "application/json" }
  });
});
