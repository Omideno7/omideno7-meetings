import type { UserProfile } from "../types/roles";
import { mockProfiles } from "../data/mockProfiles";
import { dataMode } from "../config/dataMode";
import { supabaseAuthService } from "./supabaseAuthService";

const STORAGE_KEY = "omideno7.react.profile";

export const authService = {
  getCurrentProfile(): UserProfile | null {
    if (dataMode === "supabase") return null;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  saveProfile(profile: UserProfile | null): void {
    if (!profile) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  updateLocalProfile(patch: Partial<UserProfile>): UserProfile | null {
    const current = this.getCurrentProfile();
    if (!current) return null;

    const next = { ...current, ...patch };
    this.saveProfile(next);
    return next;
  },

  async hydrateSupabaseProfile(): Promise<UserProfile | null> {
    if (dataMode !== "supabase" || !supabaseAuthService.isReady()) {
      return this.getCurrentProfile();
    }

    const profile = await supabaseAuthService.getCurrentProfile();
    this.saveProfile(profile);
    return profile;
  },

  loginAs(role: "owner" | "member" | "pending"): UserProfile {
    const profile = mockProfiles[role];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  },

  async signIn(email: string, password: string) {
    const result = await supabaseAuthService.signIn(email, password);

    if (result.profile) {
      this.saveProfile(result.profile);
    }

    return result;
  },

  async signUp(email: string, password: string, fullName: string) {
    const result = await supabaseAuthService.signUp(email, password, fullName);

    if (result.profile) {
      this.saveProfile(result.profile);
    }

    return result;
  },

  async logout(): Promise<void> {
    await supabaseAuthService.signOut();

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("omideno7.profile.override");
    localStorage.removeItem("omideno7.livekit.deviceId.v4");
  }
};
