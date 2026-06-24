import { dataMode } from "../config/dataMode";
import { supabase } from "./supabaseClient";

export async function hasRealSupabaseSession() {
  if (dataMode !== "supabase") return true;
  if (!supabase) return false;

  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.access_token);
}

export async function clearStaleLocalSessionIfNeeded() {
  if (dataMode !== "supabase") return false;
  if (!supabase) return false;

  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return false;

  localStorage.removeItem("omideno7.react.profile");
  localStorage.removeItem("omideno7.profile.override");
  return true;
}
