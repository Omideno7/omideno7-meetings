import type { UserRole } from "../types/roles";

export const permissions: Record<string, UserRole[]> = {
  viewOwnerDashboard: ["owner"],
  manageAccessRequests: ["owner"],
  activateEmergencyLockdown: ["owner"],
  approveMembers: ["owner"],
  approveServants: ["owner"],
  assignPermissionTemplates: ["owner"],

  admitWaitingRoom: ["owner", "senior_host", "meeting_host", "co_host", "door_servant"],
  rejectWaitingRoom: ["owner", "senior_host", "meeting_host", "co_host", "door_servant"],
  removeParticipant: ["owner", "senior_host", "meeting_host", "co_host"],
  activateLectureMode: ["owner", "senior_host", "co_host"],
  startRecording: ["owner", "media_servant"],
  publishRecording: ["owner"],
  viewFullReports: ["owner"],
  viewLimitedReports: ["owner", "senior_host", "meeting_host"]
};

export function hasPermission(role: UserRole, permission: keyof typeof permissions): boolean {
  return permissions[permission]?.includes(role) ?? false;
}
