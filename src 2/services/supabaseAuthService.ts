import type { UserProfile, UserRole, UserStatus } from "../types/roles";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

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
    twoFactorRequired: row.role !== "approved_member"
  };
}

export const supabaseAuthService = {
  isReady() {
    return Boolean(isSupabaseConfigured && supabase);
  },

  async getCurrentProfile(): Promise<UserProfile | null> {
    if (!supabase) return null;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      return profileFromRow(data);
    }

    // Fallback if trigger has not created profile yet.
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

    const profile = await this.getCurrentProfile();
    return {
      profile,
      error: null,
      message: "Account created. If email confirmation is enabled, confirm the email first. Owner must approve the profile."
    };
  },

  async signOut(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
};
