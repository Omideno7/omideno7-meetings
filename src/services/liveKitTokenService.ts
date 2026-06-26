import { liveKitReadyConfig, isLiveKitConfigured } from "../config/liveKitReady";
import { supabase } from "./supabaseClient";
import type { UserProfile } from "../types/roles";

export type LiveKitTokenResponse =
  | { ok: true; token: string; wsUrl: string; roomName: string; identity: string; isHost: boolean }
  | { ok: false; reason: string; message?: string };

function safeRandomId() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDeviceId() {
  const key = "omideno7.livekit.deviceId.v5";
  try {
    let existing = sessionStorage.getItem(key);
    if (!existing) {
      existing = safeRandomId();
      sessionStorage.setItem(key, existing);
    }
    return existing;
  } catch {
    return safeRandomId();
  }
}

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => window.clearTimeout(timer) };
}

export const liveKitTokenService = {
  async requestToken({ meetingId, profile, admitted }: { meetingId: string; profile: UserProfile | null; admitted: boolean }): Promise<LiveKitTokenResponse> {
    if (!isLiveKitConfigured()) {
      return {
        ok: false,
        reason: "livekit_not_configured",
        message: "LiveKit is not configured. Check VITE_LIVEKIT_ENABLED and VITE_LIVEKIT_WS_URL in Vercel."
      };
    }

    if (!profile || profile.status !== "approved") {
      return { ok: false, reason: "profile_not_approved", message: "Your account is not approved yet." };
    }

    const hostRoles = ["owner", "senior_host", "meeting_host", "co_host", "door_servant", "media_servant", "prayer_servant", "chat_moderator"];
    const isHostLike = hostRoles.includes(profile.role);

    if (!admitted && !isHostLike) {
      return { ok: false, reason: "waiting_room_admission_required", message: "Member must be admitted from Waiting Room first." };
    }

    let sessionResult = await supabase?.auth.getSession();
    let accessToken = sessionResult?.data.session?.access_token;

    if (!accessToken) {
      try {
        const refreshed = await supabase?.auth.refreshSession();
        accessToken = refreshed?.data.session?.access_token;
      } catch {
        // ignore refresh errors
      }
    }

    if (!accessToken) {
      localStorage.removeItem("omideno7.react.profile");
      localStorage.removeItem("omideno7.profile.override");
      return { ok: false, reason: "missing_supabase_session", message: "Please sign out, refresh, and sign in again on this device." };
    }

    const timeout = timeoutSignal(15000);

    try {
      const response = await fetch(liveKitReadyConfig.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        signal: timeout.signal,
        body: JSON.stringify({
          meetingId,
          roomName: liveKitReadyConfig.defaultRoom,
          deviceId: getDeviceId(),
          mobileSafe: /iPhone|iPad|iPod|Android|Mobile|Tablet/i.test(navigator.userAgent || "") || Number(navigator.maxTouchPoints || 0) > 1
        })
      });

      const rawText = await response.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        return {
          ok: false,
          reason: `invalid_token_response_${response.status}`,
          message: `LiveKit token endpoint returned non-JSON (${response.status}). Open /api/livekit/debug and check Vercel Functions.`
        };
      }

      if (!response.ok || !data.ok) {
        return {
          ok: false,
          reason: data.reason || `http_${response.status}`,
          message: data.message || `LiveKit token error: ${data.reason || response.status}`
        };
      }

      return data as LiveKitTokenResponse;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return {
          ok: false,
          reason: "token_request_timeout",
          message: "LiveKit token request timed out after 15 seconds. Check /api/livekit/debug and Vercel Environment Variables."
        };
      }

      return {
        ok: false,
        reason: "token_request_failed",
        message: error?.message || "Could not request LiveKit token."
      };
    } finally {
      timeout.cancel();
    }
  }
};
