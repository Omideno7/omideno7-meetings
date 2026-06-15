import { supabase } from "./supabaseClient";

export const supabaseAccessRequestService = {
  async listRequests() {
    if (!supabase) return { data: [], error: "Supabase not configured" };
    const { data, error } = await supabase.from("access_requests").select("*").order("created_at", { ascending: false });
    return { data: data || [], error: error?.message || null };
  },
  async submitRequest(input: Record<string, unknown>) {
    if (!supabase) return { data: null, error: "Supabase not configured" };
    const { data, error } = await supabase.from("access_requests").insert(input).select().single();
    return { data, error: error?.message || null };
  },
  async updateRequest(id: string, status: string, approved_role?: string) {
    if (!supabase) return { data: null, error: "Supabase not configured" };
    const { data, error } = await supabase.from("access_requests").update({ status, approved_role, reviewed_at: new Date().toISOString() }).eq("id", id).select().single();
    return { data, error: error?.message || null };
  }
};
