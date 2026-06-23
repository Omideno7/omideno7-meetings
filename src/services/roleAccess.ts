import { roles, hostRoles } from "../config/roles";
import type { UserProfile, UserRole } from "../types/roles";

export function isApprovedProfile(profile: UserProfile | null): boolean {
  return Boolean(profile && profile.status === "approved");
}

export function isOwner(profile: UserProfile | null): boolean {
  return Boolean(profile && profile.status === "approved" && profile.role === roles.OWNER);
}

export function isHostLike(profile: UserProfile | null): boolean {
  return Boolean(profile && profile.status === "approved" && hostRoles.includes(profile.role));
}

export function canManageWaitingRoom(profile: UserProfile | null): boolean {
  return Boolean(profile && profile.status === "approved" && [
    roles.OWNER,
    roles.SENIOR_HOST,
    roles.MEETING_HOST,
    roles.CO_HOST,
    roles.DOOR_SERVANT
  ].includes(profile.role));
}

export function canControlMicrophones(profile: UserProfile | null): boolean {
  return Boolean(profile && profile.status === "approved" && [
    roles.OWNER,
    roles.SENIOR_HOST,
    roles.MEETING_HOST,
    roles.CO_HOST
  ].includes(profile.role));
}

export function canEndWholeMeeting(profile: UserProfile | null): boolean {
  return Boolean(profile && profile.status === "approved" && [
    roles.OWNER,
    roles.SENIOR_HOST,
    roles.MEETING_HOST,
    roles.CO_HOST
  ].includes(profile.role));
}

export function canCreateOrEditMeetings(profile: UserProfile | null): boolean {
  return Boolean(profile && profile.status === "approved" && [
    roles.OWNER,
    roles.SENIOR_HOST,
    roles.MEETING_HOST,
    roles.CO_HOST
  ].includes(profile.role));
}

export function roleLabel(role?: UserRole) {
  return (role || "pending").replaceAll("_", " ");
}
