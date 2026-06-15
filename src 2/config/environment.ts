export const environment = {
  appName: import.meta.env.VITE_APP_NAME || "OmideNo7 Meetings",
  ownerName: import.meta.env.VITE_APP_OWNER_NAME || "Apostle Yuhana",
  appStage: import.meta.env.VITE_APP_STAGE || "development",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL || ""
};

export const isSupabaseConfigured = Boolean(environment.supabaseUrl && environment.supabasePublishableKey);
export const isLiveKitConfigured = Boolean(environment.livekitUrl);
