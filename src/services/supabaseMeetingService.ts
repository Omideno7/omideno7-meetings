import { supabase } from "./supabaseClient";

export const supabaseMeetingService = {
  async listMeetings() {
    if (!supabase) return { data: [], error: "Supabase not configured" };
    const { data, error } = await supabase.from("meetings").select("*").order("scheduled_start", { ascending: true });
    return { data: data || [], error: error?.message || null };
  },
  async updateWaitingEntry(id: string, status: "admitted" | "rejected" | "removed") {
    if (!supabase) return { data: null, error: "Supabase not configured" };
    const patch: Record<string, unknown> = { status };
    if (status === "admitted") patch.admitted_at = new Date().toISOString();
    if (status === "rejected") patch.rejected_at = new Date().toISOString();
    const { data, error } = await supabase.from("waiting_room_entries").update(patch).eq("id", id).select().single();
    return { data, error: error?.message || null };
  }
};
