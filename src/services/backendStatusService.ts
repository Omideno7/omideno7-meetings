import { dataMode } from "../config/dataMode";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const backendStatusService = {
  getStatus() {
    return {
      dataMode,
      isSupabaseConfigured,
      liveKitReady: Boolean(import.meta.env.VITE_LIVEKIT_URL),
      message: isSupabaseConfigured ? "Supabase environment values are present." : "Supabase is not connected yet. App is running in local demo mode."
    };
  },
  async testConnection() {
    if (!supabase) return { ok: false, message: "Supabase is not configured." };
    const { error } = await supabase.from("access_requests").select("id").limit(1);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Supabase connection works." };
  }
};
