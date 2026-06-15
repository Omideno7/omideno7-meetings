import type { AppRoute } from "../types/routes";
import { approvedRoles, hostRoles, ownerOnly, roles } from "./roles";

export const appRoutes: AppRoute[] = [
  { key: "landing", label: "Landing", path: "/", public: true, allowedRoles: [roles.PUBLIC] },
  { key: "login", label: "Login", path: "/login", public: true, allowedRoles: [roles.PUBLIC] },
  { key: "requestAccess", label: "Request Access", path: "/request-access", public: true, allowedRoles: [roles.PUBLIC] },
  { key: "installApp", label: "Install App", path: "/install", public: true, allowedRoles: [roles.PUBLIC, ...approvedRoles] },
  { key: "deployTest", label: "Deploy Test", path: "/deploy-test", allowedRoles: ownerOnly },
  { key: "pendingApproval", label: "Pending Approval", path: "/pending", allowedRoles: [roles.PENDING] },

  { key: "memberHome", label: "Home", path: "/home", allowedRoles: approvedRoles },
  { key: "ownerDashboard", label: "Owner Dashboard", path: "/owner", allowedRoles: ownerOnly },
  { key: "approvals", label: "Approvals", path: "/owner/approvals", allowedRoles: ownerOnly },

  { key: "waitingRoom", label: "Waiting Room", path: "/waiting-room", allowedRoles: approvedRoles },
  { key: "liveMeeting", label: "Live Meeting", path: "/live", allowedRoles: approvedRoles },

  { key: "notifications", label: "Notifications", path: "/notifications", allowedRoles: approvedRoles },
  { key: "inbox", label: "Inbox", path: "/inbox", allowedRoles: approvedRoles },
  { key: "mediaLibrary", label: "Media Library", path: "/media", allowedRoles: approvedRoles },
  { key: "reports", label: "Reports", path: "/reports", allowedRoles: hostRoles },

  { key: "systemSetup", label: "System Setup", path: "/owner/system", allowedRoles: ownerOnly },
  { key: "liveKitSetup", label: "LiveKit Setup", path: "/owner/livekit", allowedRoles: ownerOnly },
  { key: "productionRoadmap", label: "Production Roadmap", path: "/owner/roadmap", allowedRoles: ownerOnly },
  { key: "prototypeAudit", label: "Prototype Audit", path: "/owner/audit", allowedRoles: ownerOnly },
  { key: "securityTestPlan", label: "Security Test Plan", path: "/owner/security-tests", allowedRoles: ownerOnly }
];
