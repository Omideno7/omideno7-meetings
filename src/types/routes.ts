import type { UserRole } from "./roles";

export type AppRouteKey =
  | "landing"
  | "login"
  | "requestAccess"
  | "pendingApproval"
  | "memberHome"
  | "ownerDashboard"
  | "approvals"
  | "waitingRoom"
  | "liveMeeting"
  | "notifications"
  | "inbox"
  | "mediaLibrary"
  | "reports"
  | "systemSetup"
  | "liveKitSetup"
  | "productionRoadmap"
  | "prototypeAudit"
  | "securityTestPlan"
  | "installApp"
  | "deployTest";

export type AppRoute = {
  key: AppRouteKey;
  label: string;
  path: string;
  public?: boolean;
  allowedRoles: UserRole[];
};
