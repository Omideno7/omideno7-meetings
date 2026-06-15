import { mockAccessRequests } from "../data/mockAccessRequests";

export type AccessRequestInput = {
  fullName: string;
  email: string;
  country: string;
  relationship: string;
  reason: string;
};

export const accessRequestService = {
  listPending() {
    return mockAccessRequests.filter((item) => item.status === "pending");
  },

  submit(input: AccessRequestInput) {
    return {
      id: `req_${Date.now()}`,
      ...input,
      status: "pending",
      risk: "normal"
    };
  }
};
