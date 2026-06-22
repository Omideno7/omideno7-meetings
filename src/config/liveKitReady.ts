export const liveKitReadyConfig = {
  mode: import.meta.env.VITE_LIVEKIT_MODE || "demo",
  wsUrl: import.meta.env.VITE_LIVEKIT_WS_URL || "",
  tokenEndpoint: import.meta.env.VITE_LIVEKIT_TOKEN_ENDPOINT || "/api/livekit/token",
  defaultRoom: import.meta.env.VITE_LIVEKIT_DEFAULT_ROOM || "omideno7-main-room"
};

export function isLiveKitConfigured() {
  return Boolean(liveKitReadyConfig.wsUrl && liveKitReadyConfig.tokenEndpoint);
}
