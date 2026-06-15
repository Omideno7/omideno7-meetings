import type { AppRouteKey } from "../types/routes";
import type { UserProfile } from "../types/roles";
import { appRoutes } from "../config/routes";

export function canOpenRoute(routeKey: AppRouteKey, profile: UserProfile | null): boolean {
  const route = appRoutes.find((item) => item.key === routeKey);
  if (!route) return false;
  if (route.public) return true;
  if (!profile) return false;
  return route.allowedRoles.includes(profile.role);
}

export function getDefaultRoute(profile: UserProfile | null): AppRouteKey {
  if (!profile) return "landing";
  if (profile.status === "pending") return "pendingApproval";
  if (profile.role === "owner") return "ownerDashboard";
  return "memberHome";
}
