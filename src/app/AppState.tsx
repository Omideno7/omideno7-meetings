import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { UserProfile } from "../types/roles";
import type { AppRouteKey } from "../types/routes";
import { authService } from "../services/authService";
import { getDefaultRoute } from "../services/routeGuard";
import { profileSettingsService } from "../services/profileSettingsService";
import { dataMode } from "../config/dataMode";
import { clearStaleLocalSessionIfNeeded } from "../services/authSessionGuard";

type AppStateValue = {
  profile: UserProfile | null;
  route: AppRouteKey;
  authLoading: boolean;
  authMessage: string;
  setRoute: (route: AppRouteKey) => void;
  loginAs: (role: "owner" | "member" | "pending") => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

async function applyRemoteProfileSettings(profile: UserProfile | null) {
  const settings = await profileSettingsService.load(profile);
  return profileSettingsService.merge(profile, settings);
}

function applyProfileOverride(profile: UserProfile | null) {
  try {
    const override = JSON.parse(localStorage.getItem("omideno7.profile.override") || "{}");
    if (!profile || !override) return profile;
    return {
      ...profile,
      displayName: override.displayName || profile.displayName,
      fullName: override.displayName || profile.fullName,
      avatarUrl: override.avatarUrl || profile.avatarUrl
    };
  } catch {
    return profile;
  }
}

function getInitialProfile() {
  // In real Supabase mode, do not trust cached localStorage profile on first render.
  // It can survive after the browser lost the Supabase session and cause "Auth session missing".
  if (dataMode === "supabase") return null;
  return applyProfileOverride(authService.getCurrentProfile());
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => getInitialProfile());
  const [route, setRoute] = useState<AppRouteKey>(() => getDefaultRoute(getInitialProfile()));
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  async function refreshProfile() {
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const cleared = await clearStaleLocalSessionIfNeeded();
      if (cleared) {
        setProfile(null);
        setRoute("landing");
        setAuthMessage("Please sign in again.");
        return;
      }

      const next = await authService.hydrateSupabaseProfile();
      const merged = applyProfileOverride(await applyRemoteProfileSettings(next));
      setProfile(merged);
      setRoute(getDefaultRoute(merged));
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    if (dataMode === "supabase") {
      void refreshProfile();
    }
  }, []);

  useEffect(() => {
    function handleMissingAuthSession() {
      localStorage.removeItem("omideno7.react.profile");
      localStorage.removeItem("omideno7.profile.override");
      setProfile(null);
      setRoute("landing");
      setAuthMessage("Your secure login session expired. Please sign in again before joining LiveKit.");
    }

    window.addEventListener("omide-auth-session-missing", handleMissingAuthSession);
    return () => window.removeEventListener("omide-auth-session-missing", handleMissingAuthSession);
  }, []);

  const value = useMemo<AppStateValue>(() => ({
    profile,
    route,
    authLoading,
    authMessage,
    setRoute,
    loginAs(role) {
      const next = authService.loginAs(role);
      const merged = applyProfileOverride(next);
      setProfile(merged);
      setRoute(getDefaultRoute(merged));
    },
    async signIn(email, password) {
      setAuthLoading(true);
      setAuthMessage("");
      const result = await authService.signIn(email, password);
      setAuthLoading(false);

      if (result.error) {
        setAuthMessage(result.error);
        return;
      }

      const merged = applyProfileOverride(await applyRemoteProfileSettings(result.profile));
      setProfile(merged);
      setRoute(getDefaultRoute(merged));
    },
    async signUp(email, password, fullName) {
      setAuthLoading(true);
      setAuthMessage("");
      const result = await authService.signUp(email, password, fullName);
      setAuthLoading(false);

      if (result.error) {
        setAuthMessage(result.error);
        return;
      }

      setAuthMessage(result.message || "Account created.");
      const merged = applyProfileOverride(await applyRemoteProfileSettings(result.profile));
      setProfile(merged);
      setRoute(merged ? getDefaultRoute(merged) : "pendingApproval");
    },
    refreshProfile,
    updateProfile(patch) {
      const next = authService.updateLocalProfile(patch);
      if (next) setProfile(applyProfileOverride(next));
    },
    async logout() {
      await authService.logout();
      setProfile(null);
      setRoute("landing");
    }
  }), [profile, route, authLoading, authMessage]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
