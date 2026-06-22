export type UserRole =
  | "public"
  | "pending"
  | "approved_member"
  | "owner"
  | "senior_host"
  | "meeting_host"
  | "co_host"
  | "door_servant"
  | "media_servant"
  | "prayer_servant"
  | "chat_moderator";

export type UserStatus = "public" | "pending" | "approved" | "rejected" | "blocked" | "suspended";

export type UserProfile = {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  twoFactorRequired?: boolean;
  avatarUrl?: string;
};
