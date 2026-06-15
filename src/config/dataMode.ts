export const dataMode = (import.meta.env.VITE_DATA_MODE || "local").toLowerCase();

export function isSupabaseMode() {
  return dataMode === "supabase";
}
