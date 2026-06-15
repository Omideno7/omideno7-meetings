import type { UserProfile } from "../types/roles";

export const liveKitTokenService = {
  async requestToken({ meetingId, profile, admitted }: { meetingId: string; profile: UserProfile | null; admitted: boolean }) {
    if (!profile || profile.status !== "approved") {
      return { ok: false, reason: "profile_not_approved" };
    }

    if (!admitted) {
      return { ok: false, reason: "waiting_room_admission_required" };
    }

    return {
      ok: true,
      token: "SERVER_GENERATED_LIVEKIT_TOKEN_PLACEHOLDER",
      roomName: `omideno7-${meetingId}`,
      micEnabled: false,
      cameraEnabled: false
    };
  }
};
