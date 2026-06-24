import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type { UserProfile } from "../types/roles";

export type RoomParticipantStatus = "waiting" | "online" | "removed" | "blocked" | "left";

export type RoomParticipant = {
  id: string;
  meeting_id: string;
  profile_id: string | null;
  display_name: string;
  role_label: string;
  avatar_url: string | null;
  mic_on: boolean;
  camera_on: boolean;
  hand_raised: boolean;
  allowed_mic: boolean;
  room_name: string;
  status: RoomParticipantStatus;
  created_at?: string;
  updated_at?: string;
};

export type RoomChatMessage = {
  id: string;
  meeting_id: string;
  sender_id: string | null;
  sender_name: string;
  target_type: "everyone" | "hosts" | "direct";
  target_id: string | null;
  message: string;
  created_at?: string;
};

export type MeetingRoomSettings = {
  meeting_id: string;
  chat_mode: "public" | "admin" | "closed";
  live_open: boolean;
  active_room_name: string;
  updated_at?: string;
};

export type RoomAlert = {
  id: string;
  meeting_id: string;
  alert_type: string;
  title: string;
  status: "active" | "resolved";
  color: "red" | "green" | "blue";
  created_at?: string;
};

export const roomParticipantId = (meetingId: string, profileId: string | null | undefined) => `${meetingId}::${profileId || "guest"}`;

const MEETING_ID = "main-room";
const LOCAL_PARTICIPANTS = "omideno7.room.participants.v2";
const LOCAL_CHAT = "omideno7.room.chat.v2";
const LOCAL_ALERTS = "omideno7.room.alerts.v2";
const LOCAL_SETTINGS = "omideno7.room.settings.v1";

function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function toParticipant(profile: UserProfile | null, status: RoomParticipantStatus, patch: Partial<RoomParticipant> = {}): RoomParticipant {
  const profileId = profile?.id || "guest";
  return {
    id: roomParticipantId(MEETING_ID, profileId),
    meeting_id: MEETING_ID,
    profile_id: profile?.id || null,
    display_name: profile?.displayName || "Guest",
    role_label: profile?.role?.replaceAll("_", " ") || "member",
    avatar_url: profile?.avatarUrl || null,
    mic_on: false,
    camera_on: false,
    hand_raised: false,
    allowed_mic: false,
    room_name: "Main Room",
    status,
    ...patch
  };
}

export const meetingRoomService = {
  meetingId: MEETING_ID,

  isReady() {
    return Boolean(isSupabaseConfigured && supabase);
  },

  async joinWaiting(profile: UserProfile | null) {
    const row = toParticipant(profile, "waiting");
    return this.upsertParticipant(row);
  },

  async enterOnline(profile: UserProfile | null, patch: Partial<RoomParticipant> = {}) {
    const row = toParticipant(profile, "online", patch);
    return this.upsertParticipant(row);
  },

  async upsertParticipant(row: RoomParticipant) {
    if (supabase) {
      const { error } = await supabase.from("meeting_room_participants").upsert(row, { onConflict: "id" });
      if (!error) return row;
    }

    const local = readLocal<RoomParticipant[]>(LOCAL_PARTICIPANTS, []);
    writeLocal(LOCAL_PARTICIPANTS, [row, ...local.filter((item) => item.id !== row.id)]);
    return row;
  },

  async leaveMeeting(profile: UserProfile | null) {
    if (!profile?.id) return;
    await this.updateParticipant(roomParticipantId(MEETING_ID, profile.id), {
      status: "left",
      mic_on: false,
      camera_on: false,
      updated_at: new Date().toISOString()
    });
  },

  async getMyRow(profile: UserProfile | null): Promise<RoomParticipant | null> {
    if (!profile?.id) return null;
    const id = roomParticipantId(MEETING_ID, profile.id);

    if (supabase) {
      const { data, error } = await supabase
        .from("meeting_room_participants")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) return data as RoomParticipant;
    }

    return readLocal<RoomParticipant[]>(LOCAL_PARTICIPANTS, []).find((item) => item.id === id) || null;
  },

  async listParticipants(status?: RoomParticipantStatus): Promise<RoomParticipant[]> {
    if (supabase) {
      let query = supabase
        .from("meeting_room_participants")
        .select("*")
        .eq("meeting_id", MEETING_ID)
        .order("updated_at", { ascending: false });
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (!error && data) return data as RoomParticipant[];
    }

    const rows = readLocal<RoomParticipant[]>(LOCAL_PARTICIPANTS, []);
    return status ? rows.filter((item) => item.status === status) : rows;
  },

  async updateParticipant(id: string, patch: Partial<RoomParticipant>) {
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => typeof value !== "undefined")
    ) as Partial<RoomParticipant>;

    if (supabase) {
      const { error } = await supabase
        .from("meeting_room_participants")
        .update({ ...cleanPatch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) return;
    }

    const local = readLocal<RoomParticipant[]>(LOCAL_PARTICIPANTS, []);
    writeLocal(LOCAL_PARTICIPANTS, local.map((item) => item.id === id ? { ...item, ...cleanPatch, updated_at: new Date().toISOString() } : item));
  },

  async admitParticipant(id: string) {
    await this.updateParticipant(id, { status: "online", room_name: "Main Room", allowed_mic: true });
    await this.raiseAlert("A waiting member was admitted.", "waiting_resolved", "red", "resolved");
  },

  async rejectParticipant(id: string) {
    await this.updateParticipant(id, { status: "removed" });
    await this.raiseAlert("A waiting member was rejected.", "waiting_resolved", "red", "resolved");
  },

  async removeParticipant(id: string) {
    await this.updateParticipant(id, { status: "removed", mic_on: false, camera_on: false, allowed_mic: false });
    await this.raiseAlert("A participant was removed from the meeting.", "security", "red", "active");
  },

  async setParticipantMicPermission(id: string, allowed: boolean) {
    if (supabase) {
      const { error: rpcError } = await supabase.rpc("host_set_participant_mic_permission", {
        p_participant_id: id,
        p_allowed: allowed
      });
      if (!rpcError) {
        await this.raiseAlert(allowed ? "Microphone permission was allowed." : "Microphone permission was locked by host.", "mic_permission", "red", "active");
        return;
      }
    }

    await this.updateParticipant(id, {
      allowed_mic: allowed,
      mic_on: allowed ? undefined : false
    } as Partial<RoomParticipant>);
    await this.raiseAlert(allowed ? "Microphone permission was allowed." : "Microphone permission was locked by host.", "mic_permission", "red", "active");
  },

  async updateParticipantRole(id: string, roleLabel: string) {
    const normalized = String(roleLabel || "approved_member").replaceAll(" ", "_");
    if (supabase) {
      const { error: rpcError } = await supabase.rpc("host_update_participant_role", {
        p_participant_id: id,
        p_role_label: normalized
      });
      if (!rpcError) return;
    }

    await this.updateParticipant(id, {
      role_label: normalized,
      allowed_mic: normalized === "co_host" ? true : undefined
    } as Partial<RoomParticipant>);
  },

  async updateProfileRole(profileId: string | null, role: string) {
    if (!profileId) return false;
    if (supabase) {
      const { error } = await supabase
        .from("profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", profileId);
      if (!error) return true;
    }
    return false;
  },

  async sendChat(profile: UserProfile | null, message: string, targetType: RoomChatMessage["target_type"] = "everyone", targetId: string | null = null) {
    const row = {
      meeting_id: MEETING_ID,
      sender_id: profile?.id || null,
      sender_name: profile?.displayName || "Guest",
      target_type: targetType,
      target_id: targetId,
      message
    };

    if (supabase) {
      const { error } = await supabase.from("meeting_room_chat_messages").insert(row);
      if (!error) return;
    }

    const local = readLocal<RoomChatMessage[]>(LOCAL_CHAT, []);
    writeLocal(LOCAL_CHAT, [{ id: crypto.randomUUID(), ...row, created_at: new Date().toISOString() } as RoomChatMessage, ...local]);
  },

  async listChat(): Promise<RoomChatMessage[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("meeting_room_chat_messages")
        .select("*")
        .eq("meeting_id", MEETING_ID)
        .order("created_at", { ascending: true })
        .limit(120);
      if (!error && data) return data as RoomChatMessage[];
    }
    return readLocal<RoomChatMessage[]>(LOCAL_CHAT, []).slice().reverse();
  },

  async getSettings(): Promise<MeetingRoomSettings> {
    if (supabase) {
      const { data, error } = await supabase
        .from("meeting_room_settings")
        .select("*")
        .eq("meeting_id", MEETING_ID)
        .maybeSingle();

      if (!error && data) return data as MeetingRoomSettings;

      const fallback = { meeting_id: MEETING_ID, chat_mode: "public" as const, live_open: true, active_room_name: "Main Room" };
      await supabase.from("meeting_room_settings").upsert(fallback, { onConflict: "meeting_id" });
      return fallback;
    }

    return readLocal<MeetingRoomSettings>(LOCAL_SETTINGS, {
      meeting_id: MEETING_ID,
      chat_mode: "public",
      live_open: true,
      active_room_name: "Main Room"
    });
  },

  async updateSettings(patch: Partial<MeetingRoomSettings>): Promise<boolean> {
    const next = {
      meeting_id: MEETING_ID,
      ...patch,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { error: rpcError } = await supabase.rpc("host_update_room_settings", {
        p_chat_mode: patch.chat_mode ?? null,
        p_live_open: typeof patch.live_open === "boolean" ? patch.live_open : null,
        p_active_room_name: patch.active_room_name ?? null
      });
      if (!rpcError) return true;

      console.warn("host_update_room_settings RPC failed", rpcError.message);

      const { error } = await supabase
        .from("meeting_room_settings")
        .upsert(next, { onConflict: "meeting_id" });
      if (!error) return true;

      console.warn("meeting_room_settings upsert failed", error.message);
      return false;
    }

    const current = await this.getSettings();
    writeLocal(LOCAL_SETTINGS, { ...current, ...next });
    return true;
  },

  async clearChat() {
    if (supabase) {
      await supabase
        .from("meeting_room_chat_messages")
        .delete()
        .eq("meeting_id", MEETING_ID);
    }

    writeLocal(LOCAL_CHAT, []);
  },

  async endMeetingForEveryone() {
    if (supabase) {
      const { error } = await supabase.rpc("host_end_meeting_for_everyone");
      await this.clearChat();
      if (!error) return;
    }

    await this.updateSettings({
      live_open: false,
      chat_mode: "closed",
      active_room_name: "Main Room"
    });

    const local = readLocal<RoomParticipant[]>(LOCAL_PARTICIPANTS, []);
    writeLocal(LOCAL_PARTICIPANTS, local.map((item) => ({
      ...item,
      status: item.status === "waiting" || item.status === "online" ? "removed" : item.status,
      mic_on: false,
      camera_on: false,
      updated_at: new Date().toISOString()
    })));

    writeLocal(LOCAL_CHAT, []);
    await this.raiseAlert("The host ended the meeting for everyone.", "meeting_ended", "red", "active");
  },

  async openMeetingForEveryone() {
    await this.updateSettings({
      live_open: true,
      active_room_name: "Main Room"
    });
  },

  async raiseAlert(title: string, alertType = "info", color: RoomAlert["color"] = "red", status: RoomAlert["status"] = "active") {
    const row = {
      meeting_id: MEETING_ID,
      alert_type: alertType,
      title,
      status,
      color
    };

    if (supabase) {
      const { error } = await supabase.from("meeting_room_alerts").insert(row);
      if (!error) return;
    }

    const local = readLocal<RoomAlert[]>(LOCAL_ALERTS, []);
    writeLocal(LOCAL_ALERTS, [{ id: crypto.randomUUID(), ...row, created_at: new Date().toISOString() } as RoomAlert, ...local]);
  },

  async listAlerts(): Promise<RoomAlert[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("meeting_room_alerts")
        .select("*")
        .eq("meeting_id", MEETING_ID)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) return data as RoomAlert[];
    }
    return readLocal<RoomAlert[]>(LOCAL_ALERTS, []);
  },

  subscribe(onChange: () => void) {
    if (!supabase) return () => undefined;

    const channel = supabase
      .channel("omideno7-room-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_room_participants" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_room_chat_messages" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_room_alerts" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_room_settings" }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
