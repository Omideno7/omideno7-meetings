import type { UserRole } from "./roles";

export type AppRouteKey =
  | "landing"
  | "login"
  | "requestAccess"
  | "pendingApproval"
  | "memberHome"
  | "profile"
  | "ownerDashboard"
  | "approvals"
  | "servantDashboard"
  | "permissionTemplates"
  | "meetingSchedule"
  | "deviceTest"
  | "waitingRoom"
  | "liveMeeting"
  | "securityCenter"
  | "auditLogs"
  | "notifications"
  | "inbox"
  | "mediaLibrary"
  | "reports"
  | "systemSetup"
  | "backendSetup"
  | "liveKitSetup"
  | "productionRoadmap"
  | "prototypeAudit"
  | "securityTestPlan"
  | "installApp"
  | "deployTest"
  | "fullBuildOverview"
  | "testingCenter"
  | "releaseReadiness"
  | "legalPagesSetup";

export type AppRoute = {
  key: AppRouteKey;
  label: string;
  path: string;
  public?: boolean;
  allowedRoles: UserRole[];
};
