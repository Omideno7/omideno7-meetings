import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type { UserProfile } from "../types/roles";

export type MeetingParticipantState = {
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
  status: "online" | "waiting" | "removed" | "blocked";
  updated_at?: string;
};

export type MeetingChatMessage = {
  id: string;
  meeting_id: string;
  sender_id: string | null;
  sender_name: string;
  target_type: "everyone" | "hosts" | "direct";
  target_id: string | null;
  message: string;
  created_at?: string;
};

export type MeetingAlert = {
  id: string;
  meeting_id: string;
  alert_type: string;
  title: string;
  status: "active" | "resolved";
  color: "red" | "green" | "blue";
  created_at?: string;
};

const LOCAL_PARTICIPANTS_KEY = "omideno7.meeting.participants.v1";
const LOCAL_CHAT_KEY = "omideno7.meeting.chat.v1";
const LOCAL_ALERT_KEY = "omideno7.meeting.alerts.v1";

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

export const meetingRealtimeService = {
  meetingId: "main-room",

  isRealtimeReady() {
    return Boolean(isSupabaseConfigured && supabase);
  },

  async upsertParticipant(profile: UserProfile | null, patch: Partial<MeetingParticipantState> = {}) {
    const state: MeetingParticipantState = {
      id: profile?.id || "local-me",
      meeting_id: this.meetingId,
      profile_id: profile?.id || null,
      display_name: profile?.displayName || "Guest",
      role_label: profile?.role?.replaceAll("_", " ") || "member",
      avatar_url: profile?.avatarUrl || null,
      mic_on: false,
      camera_on: false,
      hand_raised: false,
      allowed_mic: false,
      room_name: "Main Room",
      status: "online",
      ...patch
    };

    if (supabase) {
      const { error } = await supabase.from("meeting_participants").upsert(state, { onConflict: "meeting_id,profile_id" });
      if (!error) return state;
    }

    const local = readLocal<MeetingParticipantState[]>(LOCAL_PARTICIPANTS_KEY, []);
    const next = [state, ...local.filter((item) => item.id !== state.id && item.profile_id !== state.profile_id)];
    writeLocal(LOCAL_PARTICIPANTS_KEY, next);
    return state;
  },

  async listParticipants(): Promise<MeetingParticipantState[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("meeting_participants")
        .select("*")
        .eq("meeting_id", this.meetingId)
        .neq("status", "removed")
        .order("updated_at", { ascending: false });
      if (!error && data) return data as MeetingParticipantState[];
    }
    return readLocal<MeetingParticipantState[]>(LOCAL_PARTICIPANTS_KEY, []);
  },

  async updateParticipant(id: string, patch: Partial<MeetingParticipantState>) {
    if (supabase) {
      const { error } = await supabase
        .from("meeting_participants")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) return;
    }
    const local = readLocal<MeetingParticipantState[]>(LOCAL_PARTICIPANTS_KEY, []);
    writeLocal(LOCAL_PARTICIPANTS_KEY, local.map((item) => item.id === id ? { ...item, ...patch } : item));
  },

  async sendChat(profile: UserProfile | null, message: string, targetType: MeetingChatMessage["target_type"] = "everyone", targetId: string | null = null) {
    const row = {
      meeting_id: this.meetingId,
      sender_id: profile?.id || null,
      sender_name: profile?.displayName || "Guest",
      target_type: targetType,
      target_id: targetId,
      message
    };

    if (supabase) {
      const { error } = await supabase.from("meeting_chat_messages").insert(row);
      if (!error) return;
    }

    const local = readLocal<MeetingChatMessage[]>(LOCAL_CHAT_KEY, []);
    writeLocal(LOCAL_CHAT_KEY, [{ id: crypto.randomUUID(), ...row, created_at: new Date().toISOString() } as MeetingChatMessage, ...local]);
  },

  async listChat(): Promise<MeetingChatMessage[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("meeting_chat_messages")
        .select("*")
        .eq("meeting_id", this.meetingId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (!error && data) return data as MeetingChatMessage[];
    }
    return readLocal<MeetingChatMessage[]>(LOCAL_CHAT_KEY, []).slice().reverse();
  },

  async raiseAlert(title: string, alertType = "waiting_room") {
    const row = {
      meeting_id: this.meetingId,
      alert_type: alertType,
      title,
      status: "active",
      color: "red"
    };

    if (supabase) {
      const { error } = await supabase.from("meeting_alerts").insert(row);
      if (!error) return;
    }

    const local = readLocal<MeetingAlert[]>(LOCAL_ALERT_KEY, []);
    writeLocal(LOCAL_ALERT_KEY, [{ id: crypto.randomUUID(), ...row, created_at: new Date().toISOString() } as MeetingAlert, ...local]);
  },

  async resolveAlert(id: string) {
    if (supabase) {
      const { error } = await supabase.from("meeting_alerts").update({ status: "resolved", color: "green" }).eq("id", id);
      if (!error) return;
    }
    const local = readLocal<MeetingAlert[]>(LOCAL_ALERT_KEY, []);
    writeLocal(LOCAL_ALERT_KEY, local.map((item) => item.id === id ? { ...item, status: "resolved", color: "green" } : item));
  },

  async listAlerts(): Promise<MeetingAlert[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("meeting_alerts")
        .select("*")
        .eq("meeting_id", this.meetingId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) return data as MeetingAlert[];
    }
    return readLocal<MeetingAlert[]>(LOCAL_ALERT_KEY, []);
  },

  subscribe(onChange: () => void) {
    if (!supabase) return () => undefined;

    const channel = supabase
      .channel("omideno7-main-room-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_participants" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_chat_messages" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_alerts" }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
