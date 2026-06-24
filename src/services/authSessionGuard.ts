import { dataMode } from "../config/dataMode";
import { supabase } from "./supabaseClient";

export async function getRecoveredSupabaseSession() {
  if (dataMode !== "supabase") return null;
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session;

  try {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.data.session?.access_token) return refreshed.data.session;
  } catch {
    // session is really missing
  }

  return null;
}

export async function hasRealSupabaseSession() {
  if (dataMode !== "supabase") return true;
  return Boolean(await getRecoveredSupabaseSession());
}

export async function clearStaleLocalSessionIfNeeded() {
  if (dataMode !== "supabase") return false;
  if (!supabase) return false;

  const session = await getRecoveredSupabaseSession();
  if (session?.access_token) return false;

  localStorage.removeItem("omideno7.react.profile");
  localStorage.removeItem("omideno7.profile.override");
  return true;
}
