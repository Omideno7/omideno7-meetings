import type { AppRoute } from "../types/routes";
import { approvedRoles, hostRoles, ownerOnly, roles } from "./roles";

export const appRoutes: AppRoute[] = [
  { key: "landing", label: "Landing", path: "/", public: true, allowedRoles: [roles.PUBLIC] },
  { key: "login", label: "Login", path: "/login", public: true, allowedRoles: [roles.PUBLIC] },
  { key: "requestAccess", label: "Request Access", path: "/request-access", public: true, allowedRoles: [roles.PUBLIC] },
  { key: "installApp", label: "Install App", path: "/install", public: true, allowedRoles: [roles.PUBLIC, ...approvedRoles] },

  { key: "pendingApproval", label: "Pending Approval", path: "/pending", allowedRoles: [roles.PENDING] },

  { key: "memberHome", label: "Home", path: "/home", allowedRoles: approvedRoles },
  { key: "servantDashboard", label: "Servant Dashboard", path: "/servant", allowedRoles: hostRoles },
  { key: "meetingSchedule", label: "Meeting Schedule", path: "/meetings", allowedRoles: approvedRoles },
  { key: "waitingRoom", label: "Waiting Room", path: "/waiting-room", allowedRoles: approvedRoles },
  { key: "liveMeeting", label: "Live Meeting", path: "/live", allowedRoles: approvedRoles },
  { key: "notifications", label: "Notifications", path: "/notifications", allowedRoles: approvedRoles },
  { key: "inbox", label: "Inbox", path: "/inbox", allowedRoles: approvedRoles },
  { key: "mediaLibrary", label: "Media Library", path: "/media", allowedRoles: approvedRoles },
  { key: "reports", label: "Reports", path: "/reports", allowedRoles: hostRoles },

  { key: "ownerDashboard", label: "Owner Dashboard", path: "/owner", allowedRoles: ownerOnly },
  { key: "approvals", label: "Approvals", path: "/owner/approvals", allowedRoles: ownerOnly },
  { key: "permissionTemplates", label: "Permission Templates", path: "/owner/permissions", allowedRoles: ownerOnly },
  { key: "securityCenter", label: "Security Center", path: "/owner/security", allowedRoles: ownerOnly },
  { key: "auditLogs", label: "Audit Logs", path: "/owner/audit-logs", allowedRoles: ownerOnly },
  { key: "systemSetup", label: "System Setup", path: "/owner/system", allowedRoles: ownerOnly },
  { key: "backendSetup", label: "Backend Setup", path: "/owner/backend", allowedRoles: ownerOnly },
  { key: "liveKitSetup", label: "LiveKit Setup", path: "/owner/livekit", allowedRoles: ownerOnly },
  { key: "productionRoadmap", label: "Production Roadmap", path: "/owner/roadmap", allowedRoles: ownerOnly },
  { key: "prototypeAudit", label: "Prototype Audit", path: "/owner/audit", allowedRoles: ownerOnly },
  { key: "securityTestPlan", label: "Security Test Plan", path: "/owner/security-tests", allowedRoles: ownerOnly },
  { key: "deployTest", label: "Deploy Test", path: "/owner/deploy-test", allowedRoles: ownerOnly },
  { key: "fullBuildOverview", label: "Full Build", path: "/owner/full-build", allowedRoles: ownerOnly },
  { key: "testingCenter", label: "Testing Center", path: "/owner/testing", allowedRoles: ownerOnly },
  { key: "releaseReadiness", label: "Release Readiness", path: "/owner/release", allowedRoles: ownerOnly },
  { key: "legalPagesSetup", label: "Legal Pages", path: "/owner/legal", allowedRoles: ownerOnly }
];
