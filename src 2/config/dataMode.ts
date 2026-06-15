export type DataMode = "local" | "supabase";
export const dataMode: DataMode = (import.meta.env.VITE_DATA_MODE as DataMode) || "local";
export const shouldUseSupabase = dataMode === "supabase";
