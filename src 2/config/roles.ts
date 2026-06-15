import type { UserRole } from "../types/roles";

export const roles = {
  PUBLIC: "public",
  PENDING: "pending",
  APPROVED_MEMBER: "approved_member",
  OWNER: "owner",
  SENIOR_HOST: "senior_host",
  MEETING_HOST: "meeting_host",
  CO_HOST: "co_host",
  DOOR_SERVANT: "door_servant",
  MEDIA_SERVANT: "media_servant",
  PRAYER_SERVANT: "prayer_servant",
  CHAT_MODERATOR: "chat_moderator"
} as const satisfies Record<string, UserRole>;

export const ownerOnly: UserRole[] = [roles.OWNER];

export const hostRoles: UserRole[] = [
  roles.OWNER,
  roles.SENIOR_HOST,
  roles.MEETING_HOST,
  roles.CO_HOST,
  roles.DOOR_SERVANT,
  roles.MEDIA_SERVANT,
  roles.PRAYER_SERVANT,
  roles.CHAT_MODERATOR
];

export const approvedRoles: UserRole[] = [
  roles.OWNER,
  roles.SENIOR_HOST,
  roles.MEETING_HOST,
  roles.CO_HOST,
  roles.DOOR_SERVANT,
  roles.MEDIA_SERVANT,
  roles.PRAYER_SERVANT,
  roles.CHAT_MODERATOR,
  roles.APPROVED_MEMBER
];
