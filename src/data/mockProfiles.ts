import type { UserProfile } from "../types/roles";

export const mockProfiles: Record<string, UserProfile> = {
  owner: {
    id: "profile_owner",
    fullName: "Apostle Yuhana",
    displayName: "Apostle Yuhana",
    email: "owner@omideno7.org",
    role: "owner",
    status: "approved",
    twoFactorRequired: true
  },
  member: {
    id: "profile_member",
    fullName: "Approved Member",
    displayName: "Approved Member",
    email: "member@example.com",
    role: "approved_member",
    status: "approved"
  },
  pending: {
    id: "profile_pending",
    fullName: "Pending User",
    displayName: "Pending User",
    email: "pending@example.com",
    role: "pending",
    status: "pending"
  }
};
