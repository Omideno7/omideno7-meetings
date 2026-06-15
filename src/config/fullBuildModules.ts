import type { BuildModule } from "../types/fullBuild";

export const fullBuildModules: BuildModule[] = [
  {
    id: "auth",
    title: "Supabase Auth + Owner Bootstrap",
    description: "Real login/auth structure, owner bootstrap plan, pending/approved/blocked states.",
    status: "prepared",
    ownerOnly: true
  },
  {
    id: "approvals",
    title: "Access Requests + Approvals",
    description: "Member requests, owner approval, reject/block/more-info, role assignment.",
    status: "prepared",
    ownerOnly: true
  },
  {
    id: "roles",
    title: "Servant Roles + Permission Templates",
    description: "Senior Host, Door Servant, Media Servant, Co-host and custom permission template plan.",
    status: "prepared",
    ownerOnly: true
  },
  {
    id: "meetings",
    title: "Meeting Schedule + Waiting Room",
    description: "Meetings, waiting entries, admit/reject/remove flows and room ownership.",
    status: "prepared"
  },
  {
    id: "livekit",
    title: "LiveKit Token Server",
    description: "Server-side Edge Function placeholder for secure token generation.",
    status: "needs_credentials",
    ownerOnly: true
  },
  {
    id: "recordings",
    title: "Recording Storage + Media Library",
    description: "Private recordings, MP4, MP3, transcript, SRT/VTT and publish workflow.",
    status: "prepared",
    ownerOnly: true
  },
  {
    id: "notifications",
    title: "Notifications + Inbox + Broadcasts",
    description: "In-app notification, inbox, owner broadcast and later push provider connection.",
    status: "prepared"
  },
  {
    id: "reports",
    title: "Attendance Reports + Exports",
    description: "Attendance, connection quality, reconnects, CSV/JSON/PDF export plan.",
    status: "prepared",
    ownerOnly: true
  },
  {
    id: "testing",
    title: "Testing Center",
    description: "Owner QA center with sections, pass/fail/needs-fix states and release checklist.",
    status: "ready",
    ownerOnly: true
  },
  {
    id: "release",
    title: "Security Hardening + Release Readiness",
    description: "Privacy, terms, account deletion, data safety, RLS, store readiness.",
    status: "prepared",
    ownerOnly: true
  }
];
