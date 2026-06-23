import { liveKitReadyConfig, isLiveKitConfigured } from "../config/liveKitReady";
import { supabase } from "./supabaseClient";
import type { UserProfile } from "../types/roles";

export type LiveKitTokenResponse =
  | { ok: true; token: string; wsUrl: string; roomName: string; identity: string; isHost: boolean }
  | { ok: false; reason: string; message?: string };

function getDeviceId() {
  const key = "omideno7.livekit.deviceId.v2";
  let existing = sessionStorage.getItem(key);
  if (!existing) {
    existing = crypto.randomUUID();
    sessionStorage.setItem(key, existing);
  }
  return existing;
}

export const liveKitTokenService = {
  async requestToken({ meetingId, profile, admitted }: { meetingId: string; profile: UserProfile | null; admitted: boolean }): Promise<LiveKitTokenResponse> {
    if (!isLiveKitConfigured()) {
      return { ok: false, reason: "livekit_not_configured" };
    }

    if (!profile || profile.status !== "approved") {
      return { ok: false, reason: "profile_not_approved" };
    }

    if (!admitted) {
      return { ok: false, reason: "waiting_room_admission_required" };
    }

    const sessionResult = await supabase?.auth.getSession();
    const accessToken = sessionResult?.data.session?.access_token;

    if (!accessToken) {
      return { ok: false, reason: "missing_supabase_session" };
    }

    const response = await fetch(liveKitReadyConfig.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        meetingId,
        roomName: liveKitReadyConfig.defaultRoom,
        deviceId: getDeviceId()
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        reason: data.reason || `http_${response.status}`,
        message: data.message
      };
    }

    return data as LiveKitTokenResponse;
  }
};
