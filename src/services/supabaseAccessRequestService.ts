import { supabase } from "./supabaseClient";

export type SubmitAccessRequestInput = {
  full_name: string;
  email: string;
  country?: string;
  relationship?: string;
  reason?: string;
};

export const supabaseAccessRequestService = {
  async submitRequest(input: SubmitAccessRequestInput): Promise<{ data: any | null; error: string | null }> {
    if (!supabase) {
      return { data: null, error: "Supabase is not configured." };
    }

    const payload = {
      p_full_name: input.full_name.trim(),
      p_email: input.email.trim().toLowerCase(),
      p_country: input.country?.trim() || null,
      p_relationship: input.relationship?.trim() || null,
      p_reason: input.reason?.trim() || null
    };

    const rpcResult = await supabase.rpc("submit_access_request_public", payload);

    if (!rpcResult.error) {
      return { data: rpcResult.data, error: null };
    }

    const directResult = await supabase
      .from("access_requests")
      .insert({
        full_name: payload.p_full_name,
        email: payload.p_email,
        country: payload.p_country,
        relationship: payload.p_relationship,
        reason: payload.p_reason,
        status: "pending",
        risk: "normal"
      })
      .select()
      .single();

    return {
      data: directResult.data,
      error: directResult.error?.message || rpcResult.error.message || null
    };
  }
};
