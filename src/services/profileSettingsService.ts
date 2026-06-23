import { supabase } from "./supabaseClient";
import type { UserProfile } from "../types/roles";

const LOCAL_KEY = "omideno7.profile.settings.v2";

export type ProfileSettings = {
  displayName?: string;
  avatarUrl?: string;
};

function localKey(profileId?: string) {
  return `${LOCAL_KEY}.${profileId || "guest"}`;
}

export const profileSettingsService = {
  async load(profile: UserProfile | null): Promise<ProfileSettings> {
    if (!profile?.id) return {};

    if (supabase) {
      const { data, error } = await supabase.rpc("get_my_profile_settings");
      if (!error && Array.isArray(data) && data[0]) {
        return {
          displayName: data[0].display_name || undefined,
          avatarUrl: data[0].avatar_data_url || data[0].avatar_url || undefined
        };
      }

      const profileResult = await supabase
        .from("profiles")
        .select("display_name, full_name, avatar_url")
        .eq("id", profile.id)
        .maybeSingle();

      if (!profileResult.error && profileResult.data) {
        return {
          displayName: profileResult.data.display_name || profileResult.data.full_name || undefined,
          avatarUrl: profileResult.data.avatar_url || undefined
        };
      }
    }

    try {
      return JSON.parse(localStorage.getItem(localKey(profile.id)) || "{}");
    } catch {
      return {};
    }
  },

  async save(profile: UserProfile | null, settings: ProfileSettings) {
    if (!profile?.id) return;

    localStorage.setItem(localKey(profile.id), JSON.stringify(settings));

    if (supabase) {
      await supabase
        .from("profiles")
        .update({
          display_name: settings.displayName || profile.displayName,
          full_name: settings.displayName || profile.fullName,
          avatar_url: settings.avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id);

      await supabase.rpc("save_my_profile_settings", {
        next_display_name: settings.displayName || profile.displayName,
        next_avatar_data_url: settings.avatarUrl || null
      });
    }
  },

  merge(profile: UserProfile | null, settings: ProfileSettings): UserProfile | null {
    if (!profile) return profile;
    return {
      ...profile,
      displayName: settings.displayName || profile.displayName,
      fullName: settings.displayName || profile.fullName,
      avatarUrl: settings.avatarUrl || profile.avatarUrl
    };
  }
};
