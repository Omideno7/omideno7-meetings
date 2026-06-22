import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { UserProfile } from "../types/roles";
import type { AppRouteKey } from "../types/routes";
import { authService } from "../services/authService";
import { getDefaultRoute } from "../services/routeGuard";
import { dataMode } from "../config/dataMode";

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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => authService.getCurrentProfile());
  const [route, setRoute] = useState<AppRouteKey>(() => getDefaultRoute(authService.getCurrentProfile()));
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  async function refreshProfile() {
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const next = await authService.hydrateSupabaseProfile();
      setProfile(next);
      if (next) setRoute(getDefaultRoute(next));
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    if (dataMode === "supabase") {
      void refreshProfile();
    }
  }, []);

  const value = useMemo<AppStateValue>(() => ({
    profile,
    route,
    authLoading,
    authMessage,
    setRoute,
    loginAs(role) {
      const next = authService.loginAs(role);
      setProfile(next);
      setRoute(getDefaultRoute(next));
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

      setProfile(result.profile);
      setRoute(getDefaultRoute(result.profile));
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
      setProfile(result.profile);
      setRoute(result.profile ? getDefaultRoute(result.profile) : "pendingApproval");
    },
    refreshProfile,
    updateProfile(patch) {
      const next = authService.updateLocalProfile(patch);
      if (next) setProfile(next);
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
