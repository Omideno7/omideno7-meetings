import type { AppRouteKey } from "../types/routes";
import type { UserProfile } from "../types/roles";
import { appRoutes } from "../config/routes";
import { roles } from "../config/roles";

export function canOpenRoute(routeKey: AppRouteKey, profile: UserProfile | null): boolean {
  const route = appRoutes.find((item) => item.key === routeKey);
  if (!route) return false;

  if (route.public) return true;

  if (!profile) return false;

  // Pending/rejected/blocked/suspended accounts may only see the PendingApproval screen.
  if (profile.status !== "approved") {
    return routeKey === "pendingApproval";
  }

  if (routeKey === "pendingApproval") return false;

  // Owner/host/member permissions are role-based only after status is approved.
  return route.allowedRoles.includes(profile.role);
}

export function getDefaultRoute(profile: UserProfile | null): AppRouteKey {
  if (!profile) return "landing";

  if (profile.status !== "approved") return "pendingApproval";

  if (profile.role === roles.OWNER) return "ownerDashboard";

  return "memberHome";
}
