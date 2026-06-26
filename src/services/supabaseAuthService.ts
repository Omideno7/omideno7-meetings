import type { UserProfile, UserRole, UserStatus } from "../types/roles";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { supabaseAccessRequestService } from "./supabaseAccessRequestService";

function mapRole(role: string | null | undefined): UserRole {
  const allowed: UserRole[] = [
    "public",
    "pending",
    "approved_member",
    "owner",
    "senior_host",
    "meeting_host",
    "co_host",
    "door_servant",
    "media_servant",
    "prayer_servant",
    "chat_moderator"
  ];
  return allowed.includes(role as UserRole) ? (role as UserRole) : "pending";
}

function mapStatus(status: string | null | undefined): UserStatus {
  const allowed: UserStatus[] = ["public", "pending", "approved", "rejected", "blocked", "suspended"];
  return allowed.includes(status as UserStatus) ? (status as UserStatus) : "pending";
}

function profileFromRow(row: any): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name || row.email || "OmideNo7 User",
    displayName: row.display_name || row.full_name || row.email || "OmideNo7 User",
    email: row.email || "",
    role: mapRole(row.role),
    status: mapStatus(row.status),
    twoFactorRequired: row.role !== "approved_member",
    avatarUrl: row.avatar_url || row.avatarUrl || undefined
  };
}

async function readProfileByUserId(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!error && data) return profileFromRow(data);
  return null;
}

export const supabaseAuthService = {
  isReady() {
    return Boolean(isSupabaseConfigured && supabase);
  },

  async syncApprovalIfPossible(): Promise<UserProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase.rpc("sync_my_profile_from_access_request");

    if (!error && data) {
      return profileFromRow(data);
    }

    return null;
  },

  async getCurrentProfile(): Promise<UserProfile | null> {
    if (!supabase) return null;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return null;

    let profile = await readProfileByUserId(user.id);

    // If the profile is still pending, try to sync it with an approved access request.
    // This fixes cases where Owner approved the access request but the profile row did not refresh.
    if (profile && profile.status !== "approved") {
      const synced = await this.syncApprovalIfPossible();
      if (synced) profile = synced;
      else {
        const reread = await readProfileByUserId(user.id);
        if (reread) profile = reread;
      }
    }

    if (profile) return profile;

    return {
      id: user.id,
      fullName: user.user_metadata?.full_name || user.email || "Pending User",
      displayName: user.user_metadata?.full_name || user.email || "Pending User",
      email: user.email || "",
      role: "pending",
      status: "pending"
    };
  },

  async signIn(email: string, password: string): Promise<{ profile: UserProfile | null; error: string | null }> {
    if (!supabase) return { profile: null, error: "Supabase is not configured." };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { profile: null, error: error.message };

    const profile = await this.getCurrentProfile();
    return { profile, error: null };
  },

  async signUp(email: string, password: string, fullName: string): Promise<{ profile: UserProfile | null; error: string | null; message: string }> {
    if (!supabase) return { profile: null, error: "Supabase is not configured.", message: "" };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) return { profile: null, error: error.message, message: "" };

    const requestResult = await supabaseAccessRequestService.submitRequest({
      full_name: fullName,
      email,
      country: "",
      relationship: "Church member",
      reason: "I created an OmideNo7 Meetings account and request access to join church meetings."
    });

    const profile = await this.getCurrentProfile();
    const requestWarning = requestResult.error && !/duplicate|already|exists/i.test(requestResult.error)
      ? " Account was created, but automatic access request may need manual review."
      : "";

    return {
      profile,
      error: null,
      message: `Account created. Please confirm your email if asked. Your meeting access request was sent automatically.${requestWarning}`
    };
  },

  async signOut(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
  }
};
