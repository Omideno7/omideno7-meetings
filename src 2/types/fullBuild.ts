export type BuildModuleStatus = "ready" | "prepared" | "needs_credentials" | "future_connection";

export type BuildModule = {
  id: string;
  title: string;
  description: string;
  status: BuildModuleStatus;
  ownerOnly?: boolean;
};

export type TestingStatus = "not_tested" | "passed" | "failed" | "needs_fix";

export type TestingItem = {
  id: string;
  section: string;
  item: string;
  status: TestingStatus;
  note?: string;
};
