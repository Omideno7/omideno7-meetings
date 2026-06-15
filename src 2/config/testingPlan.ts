import type { TestingItem } from "../types/fullBuild";

export const testingPlan: TestingItem[] = [
  { id: "public-1", section: "Public Access", item: "Public user sees only Landing/Login/Request Access/Install App", status: "not_tested" },
  { id: "request-1", section: "Request Access", item: "Request form saves new request", status: "not_tested" },
  { id: "approval-1", section: "Owner Approval", item: "Approve as Member moves user to Approved Members", status: "not_tested" },
  { id: "approval-2", section: "Owner Approval", item: "Approve as Servant shows exact servant role", status: "not_tested" },
  { id: "approval-3", section: "Owner Approval", item: "Reject/Block moves request to archive", status: "not_tested" },
  { id: "member-1", section: "Member Access", item: "Member cannot open Owner pages", status: "not_tested" },
  { id: "waiting-1", section: "Waiting Room", item: "Admit moves entry from Waiting Now to Admitted", status: "not_tested" },
  { id: "waiting-2", section: "Waiting Room", item: "Reject moves entry from Waiting Now to Rejected", status: "not_tested" },
  { id: "meeting-1", section: "Live Meeting", item: "Mic and camera are off by default", status: "not_tested" },
  { id: "meeting-2", section: "Live Meeting", item: "Lecture Mode locks member microphone controls", status: "not_tested" },
  { id: "media-1", section: "Media Library", item: "Recordings are owner-only by default", status: "not_tested" },
  { id: "reports-1", section: "Reports", item: "Full reports are Owner-only", status: "not_tested" },
  { id: "pwa-1", section: "PWA", item: "iPhone Add to Home Screen works", status: "passed" }
];
