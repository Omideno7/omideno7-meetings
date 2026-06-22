import { liveKitReadyConfig, isLiveKitConfigured } from "../config/liveKitReady";

export type RealMeetingReadiness = {
  configured: boolean;
  mode: string;
  wsUrl: string;
  tokenEndpoint: string;
  defaultRoom: string;
  missing: string[];
};

export function getRealMeetingReadiness(): RealMeetingReadiness {
  const missing: string[] = [];
  if (!liveKitReadyConfig.wsUrl) missing.push("VITE_LIVEKIT_WS_URL");
  if (!liveKitReadyConfig.tokenEndpoint) missing.push("VITE_LIVEKIT_TOKEN_ENDPOINT");

  return {
    configured: isLiveKitConfigured(),
    mode: liveKitReadyConfig.mode,
    wsUrl: liveKitReadyConfig.wsUrl,
    tokenEndpoint: liveKitReadyConfig.tokenEndpoint,
    defaultRoom: liveKitReadyConfig.defaultRoom,
    missing
  };
}
