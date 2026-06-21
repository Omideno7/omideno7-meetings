import { supabase } from "./supabaseClient";
import type { UserRole } from "../types/roles";

export type PermissionTemplate = {
  id: string;
  name: string;
  role: UserRole;
  can_start_meeting: boolean;
  can_admit_waiting_room: boolean;
  can_reject_waiting_room: boolean;
  can_remove_participant: boolean;
  can_mute_participants: boolean;
  can_activate_lecture_mode: boolean;
  can_start_recording: boolean;
  can_view_limited_reports: boolean;
  can_view_full_reports: boolean;
  can_publish_recordings: boolean;
};

export type PermissionInput = Omit<PermissionTemplate, "id">;

export type ProfileRow = {
  id: string;
  full_name: string;
  display_name: string;
  email: string;
  role: UserRole;
  status: string;
  country?: string | null;
  approved_at?: string | null;
};

export type MeetingRow = {
  id: string;
  title: string;
  meeting_type: string;
  status: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  recording_enabled: boolean;
  lecture_mode: boolean;
  low_bandwidth_mode: boolean;
  livekit_room_name?: string | null;
  created_at?: string;
};

export type WaitingEntry = {
  id: string;
  meeting_id: string;
  profile_id?: string | null;
  display_name: string;
  device_label?: string | null;
  status: string;
  admitted_at?: string | null;
  rejected_at?: string | null;
  created_at?: string;
};

export type AuditRow = {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: any;
  created_at: string;
};

export const servantRoleOptions: { value: UserRole; label: string }[] = [
  { value: "approved_member", label: "Approved Member" },
  { value: "senior_host", label: "Senior Host" },
  { value: "meeting_host", label: "Meeting Host" },
  { value: "co_host", label: "Co-host" },
  { value: "door_servant", label: "Door Servant" },
  { value: "media_servant", label: "Media Servant" },
  { value: "prayer_servant", label: "Prayer Servant" },
  { value: "chat_moderator", label: "Chat Moderator" }
];

export const permissionFieldLabels: { key: keyof PermissionInput; label: string; description: string }[] = [
  { key: "can_start_meeting", label: "Start meeting", description: "Can open or start scheduled meetings." },
  { key: "can_admit_waiting_room", label: "Admit waiting room", description: "Can allow members into the room." },
  { key: "can_reject_waiting_room", label: "Reject waiting room", description: "Can reject waiting room entries." },
  { key: "can_remove_participant", label: "Remove participant", description: "Can remove disruptive users." },
  { key: "can_mute_participants", label: "Mute participants", description: "Can mute members during meetings." },
  { key: "can_activate_lecture_mode", label: "Lecture mode", description: "Can lock member microphones." },
  { key: "can_start_recording", label: "Recording", description: "Can start/stop recording workflow." },
  { key: "can_view_limited_reports", label: "Limited reports", description: "Can view basic attendance reports." },
  { key: "can_view_full_reports", label: "Full reports", description: "Can view full reports." },
  { key: "can_publish_recordings", label: "Publish recordings", description: "Can publish archive media." }
];

function errorMessage(error: any) {
  return error?.message || null;
}

function rpcPayload(template: PermissionInput) {
  return {
    p_name: template.name,
    p_role: template.role,
    p_can_start_meeting: template.can_start_meeting,
    p_can_admit_waiting_room: template.can_admit_waiting_room,
    p_can_reject_waiting_room: template.can_reject_waiting_room,
    p_can_remove_participant: template.can_remove_participant,
    p_can_mute_participants: template.can_mute_participants,
    p_can_activate_lecture_mode: template.can_activate_lecture_mode,
    p_can_start_recording: template.can_start_recording,
    p_can_view_limited_reports: template.can_view_limited_reports,
    p_can_view_full_reports: template.can_view_full_reports,
    p_can_publish_recordings: template.can_publish_recordings
  };
}

export const supabaseAdminService = {
  async seedDefaultTemplates() {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("seed_default_permission_templates");
    return { data, error: errorMessage(error) };
  },

  async listTemplates(): Promise<{ data: PermissionTemplate[]; error: string | null }> {
    if (!supabase) return { data: [], error: "Supabase not configured." };
    const { data, error } = await supabase
      .from("permission_templates")
      .select("*")
      .order("role", { ascending: true })
      .order("name", { ascending: true });
    return { data: (data || []) as PermissionTemplate[], error: errorMessage(error) };
  },

  async upsertTemplate(template: PermissionInput) {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("upsert_permission_template", rpcPayload(template));
    return { data, error: errorMessage(error) };
  },

  async createCustomTemplateAndAssign(profileId: string, template: PermissionInput) {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("create_custom_template_and_assign", {
      p_profile_id: profileId,
      ...rpcPayload(template)
    });
    return { data, error: errorMessage(error) };
  },

  async listProfiles(): Promise<{ data: ProfileRow[]; error: string | null }> {
    if (!supabase) return { data: [], error: "Supabase not configured." };
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, display_name, email, role, status, country, approved_at")
      .order("created_at", { ascending: false });
    return { data: (data || []) as ProfileRow[], error: errorMessage(error) };
  },

  async assignProfileRole(profileId: string, role: UserRole, templateName: string) {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("assign_profile_role_template", {
      p_profile_id: profileId,
      p_role: role,
      p_template_name: templateName
    });
    return { data, error: errorMessage(error) };
  },

  async listMeetings(): Promise<{ data: MeetingRow[]; error: string | null }> {
    if (!supabase) return { data: [], error: "Supabase not configured." };
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .order("scheduled_start", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    return { data: (data || []) as MeetingRow[], error: errorMessage(error) };
  },

  async createMeeting(input: { title: string; meetingType: string; start?: string; end?: string }) {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("create_meeting_admin", {
      p_title: input.title,
      p_meeting_type: input.meetingType,
      p_scheduled_start: input.start || null,
      p_scheduled_end: input.end || null
    });
    return { data, error: errorMessage(error) };
  },

  async updateMeetingState(input: {
    id: string;
    status?: string;
    lectureMode?: boolean;
    lowBandwidthMode?: boolean;
    recordingEnabled?: boolean;
  }) {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("set_meeting_state_admin", {
      p_meeting_id: input.id,
      p_status: input.status || null,
      p_lecture_mode: input.lectureMode ?? null,
      p_low_bandwidth_mode: input.lowBandwidthMode ?? null,
      p_recording_enabled: input.recordingEnabled ?? null
    });
    return { data, error: errorMessage(error) };
  },

  async listWaitingEntries(): Promise<{ data: WaitingEntry[]; error: string | null }> {
    if (!supabase) return { data: [], error: "Supabase not configured." };
    const { data, error } = await supabase
      .from("waiting_room_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return { data: (data || []) as WaitingEntry[], error: errorMessage(error) };
  },

  async joinWaitingRoom(meetingId: string, displayName: string, deviceLabel: string) {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("join_waiting_room_for_meeting", {
      p_meeting_id: meetingId,
      p_display_name: displayName,
      p_device_label: deviceLabel
    });
    return { data, error: errorMessage(error) };
  },

  async decideWaitingEntry(id: string, status: "admitted" | "rejected" | "removed") {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("decide_waiting_room_entry", {
      p_entry_id: id,
      p_next_status: status
    });
    return { data, error: errorMessage(error) };
  },

  async securityEvent(action: string, note: string) {
    if (!supabase) return { data: null, error: "Supabase not configured." };
    const { data, error } = await supabase.rpc("owner_security_event", {
      p_action: action,
      p_note: note
    });
    return { data, error: errorMessage(error) };
  },

  async listAuditLogs(): Promise<{ data: AuditRow[]; error: string | null }> {
    if (!supabase) return { data: [], error: "Supabase not configured." };
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);
    return { data: (data || []) as AuditRow[], error: errorMessage(error) };
  }
};
