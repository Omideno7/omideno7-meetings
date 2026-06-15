import { supabase } from "./supabaseClient";

export type AccessRequestStatus = "pending" | "approved" | "rejected" | "blocked" | "more_info";
export type ServantRole =
  | "approved_member"
  | "senior_host"
  | "meeting_host"
  | "co_host"
  | "door_servant"
  | "media_servant"
  | "prayer_servant"
  | "chat_moderator";

export type SupabaseAccessRequest = {
  id: string;
  full_name: string;
  email: string;
  country?: string | null;
  relationship?: string | null;
  reason?: string | null;
  status: AccessRequestStatus;
  approved_role?: ServantRole | null;
  risk?: string | null;
  decision_note?: string | null;
  account_profile_id?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
};

export const servantRoles: { value: ServantRole; label: string }[] = [
  { value: "approved_member", label: "Approved Member" },
  { value: "senior_host", label: "Senior Host" },
  { value: "meeting_host", label: "Meeting Host" },
  { value: "co_host", label: "Co-host" },
  { value: "door_servant", label: "Door Servant" },
  { value: "media_servant", label: "Media Servant" },
  { value: "prayer_servant", label: "Prayer Servant" },
  { value: "chat_moderator", label: "Chat Moderator" }
];

export const supabaseApprovalService = {
  async listRequests(): Promise<{ data: SupabaseAccessRequest[]; error: string | null }> {
    if (!supabase) return { data: [], error: "Supabase is not configured." };
    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    return { data: (data || []) as SupabaseAccessRequest[], error: error?.message || null };
  },

  async decideRequest(
    id: string,
    status: AccessRequestStatus,
    role: ServantRole = "approved_member",
    note = ""
  ): Promise<{ data: SupabaseAccessRequest | null; error: string | null }> {
    if (!supabase) return { data: null, error: "Supabase is not configured." };
    const { data, error } = await supabase.rpc("owner_decide_access_request", {
      request_id: id,
      next_status: status,
      next_role: role,
      note
    });
    return { data: data as SupabaseAccessRequest | null, error: error?.message || null };
  },

  async addDemoRequests(): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.from("access_requests").insert([
      {
        full_name: "Mary Smith",
        email: `mary.${Date.now()}@example.com`,
        country: "Croatia",
        relationship: "Church member",
        reason: "I want to join Sunday services.",
        status: "pending",
        risk: "normal"
      },
      {
        full_name: "David Brown",
        email: `david.${Date.now()}@example.com`,
        country: "Germany",
        relationship: "Servant / Media",
        reason: "I help with media and meetings.",
        status: "pending",
        risk: "review"
      }
    ]);
    return { error: error?.message || null };
  }
};
