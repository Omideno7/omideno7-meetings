export const liveKitReadyConfig = {
  enabled: import.meta.env.VITE_LIVEKIT_ENABLED === "true",
  mode: import.meta.env.VITE_LIVEKIT_MODE || "livekit",
  wsUrl: import.meta.env.VITE_LIVEKIT_WS_URL || "",
  tokenEndpoint: import.meta.env.VITE_LIVEKIT_TOKEN_ENDPOINT || "/api/livekit/token",
  defaultRoom: import.meta.env.VITE_LIVEKIT_DEFAULT_ROOM || "omideno7-main-room"
};

export function isLiveKitConfigured() {
  return Boolean(liveKitReadyConfig.enabled && liveKitReadyConfig.wsUrl && liveKitReadyConfig.tokenEndpoint);
}
