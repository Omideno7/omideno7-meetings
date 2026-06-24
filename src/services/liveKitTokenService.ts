import { liveKitReadyConfig, isLiveKitConfigured } from "../config/liveKitReady";
import { supabase } from "./supabaseClient";
import type { UserProfile } from "../types/roles";

export type LiveKitTokenResponse =
  | { ok: true; token: string; wsUrl: string; roomName: string; identity: string; isHost: boolean }
  | { ok: false; reason: string; message?: string };

function getDeviceId() {
  const key = "omideno7.livekit.deviceId.v5";
  let existing = sessionStorage.getItem(key);
  if (!existing) {
    existing = crypto.randomUUID();
    sessionStorage.setItem(key, existing);
  }
  return existing;
}

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => window.clearTimeout(timer) };
}

function readStoredSupabaseAccessToken() {
  const stores: Storage[] = [];
  try { stores.push(localStorage); } catch { /* ignore */ }
  try { stores.push(sessionStorage); } catch { /* ignore */ }

  for (const store of stores) {
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index) || "";
      if (!key.includes("auth-token") && !key.includes("supabase.auth.token")) continue;

      try {
        const raw = store.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        const token =
          parsed?.currentSession?.access_token ||
          parsed?.access_token ||
          parsed?.session?.access_token ||
          parsed?.data?.session?.access_token;

        if (typeof token === "string" && token.length > 20) return token;
      } catch {
        // ignore malformed storage entry
      }
    }
  }

  return "";
}

async function waitForAccessToken() {
  if (!supabase) return "";

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const sessionResult = await supabase.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (token) return token;

    try {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.data.session?.access_token) return refreshed.data.session.access_token;
    } catch {
      // refresh may fail when session is truly missing
    }

    const stored = readStoredSupabaseAccessToken();
    if (stored) return stored;

    await new Promise((resolve) => window.setTimeout(resolve, 450));
  }

  return "";
}

function failMissingSession(): LiveKitTokenResponse {
  localStorage.removeItem("omideno7.react.profile");
  localStorage.removeItem("omideno7.profile.override");
  window.dispatchEvent(new CustomEvent("omide-auth-session-missing"));

  return {
    ok: false,
    reason: "missing_supabase_session",
    message: "Secure login session expired. Please sign in again, then enter the live room."
  };
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

    const accessToken = await waitForAccessToken();
    if (!accessToken) return failMissingSession();

    const timeout = timeoutSignal(30000);

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
          deviceId: getDeviceId()
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
        if (data.reason === "missing_supabase_session" || data.reason === "invalid_supabase_session") {
          return failMissingSession();
        }

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
          message: "LiveKit token request timed out after 30 seconds. Check /api/livekit/debug and Vercel Environment Variables."
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
