import { createContext, useContext, useMemo, useState } from "react";
import type { UserProfile } from "../types/roles";
import type { AppRouteKey } from "../types/routes";
import { authService } from "../services/authService";
import { getDefaultRoute } from "../services/routeGuard";

type AppStateValue = {
  profile: UserProfile | null;
  route: AppRouteKey;
  setRoute: (route: AppRouteKey) => void;
  loginAs: (role: "owner" | "member" | "pending") => void;
  logout: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => authService.getCurrentProfile());
  const [route, setRoute] = useState<AppRouteKey>(() => getDefaultRoute(authService.getCurrentProfile()));

  const value = useMemo<AppStateValue>(() => ({
    profile,
    route,
    setRoute,
    loginAs(role) {
      const next = authService.loginAs(role);
      setProfile(next);
      setRoute(getDefaultRoute(next));
    },
    logout() {
      authService.logout();
      setProfile(null);
      setRoute("landing");
    }
  }), [profile, route]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
