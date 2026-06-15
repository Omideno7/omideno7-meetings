import type { UserProfile } from "../types/roles";
import { mockProfiles } from "../data/mockProfiles";

const STORAGE_KEY = "omideno7.react.profile";

export const authService = {
  getCurrentProfile(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  loginAs(role: "owner" | "member" | "pending"): UserProfile {
    const profile = mockProfiles[role];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
