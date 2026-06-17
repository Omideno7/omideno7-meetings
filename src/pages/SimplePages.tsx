import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";

export function NotificationsPage() {
  return <div className="page-grid"><Card><h1>Notifications</h1><p>Meeting reminders, owner alerts, and approval notifications will appear here.</p></Card></div>;
}

export function InboxPage() {
  return <div className="page-grid"><Card><h1>Inbox</h1><p>Approved members can receive church messages, meeting updates, and admin notices here.</p></Card></div>;
}

export function MediaLibraryPage() {
  return (
    <div className="page-grid">
      <Card><h1>Media Library</h1><p>Recordings archive will store MP4, MP3, transcript, subtitles, and publishing status.</p></Card>
      <div className="dashboard-grid">
        <Card><h2>Sunday Service Recording</h2><p>MP4 pending LiveKit recording pipeline.</p></Card>
        <Card><h2>Audio MP3</h2><p>Audio extraction workflow planned.</p></Card>
        <Card><h2>Transcript</h2><p>Transcript/SRT/VTT workflow planned.</p></Card>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { setRoute } = useAppState();
  return (
    <div className="page-grid">
      <Card>
        <h1>Reports</h1>
        <p>Attendance reports, waiting room decisions, connection quality, and servant actions will be shown here.</p>
        <div className="button-row">
          <Button onClick={() => setRoute("auditLogs")}>Open Audit Logs</Button>
          <Button variant="secondary" onClick={() => setRoute("meetingSchedule")}>Meeting Schedule</Button>
        </div>
      </Card>
      <div className="dashboard-grid">
        <Card><h2>Attendance</h2><p>Shows who joined, how long they stayed, reconnect count, and quality.</p></Card>
        <Card><h2>Waiting Room</h2><p>Tracks admitted, rejected, removed, and late arrivals.</p></Card>
        <Card><h2>Servant Activity</h2><p>Owner can audit host actions and delegated controls.</p></Card>
      </div>
    </div>
  );
}

export function LiveKitSetupPage() {
  return <div className="page-grid"><Card><h1>LiveKit Setup</h1><p>LiveKit token server, room ownership, SFU/TURN, recording, and low-bandwidth architecture are documented for production backend.</p></Card></div>;
}

export function ProductionRoadmapPage() {
  return <div className="page-grid"><Card><h1>Production Roadmap</h1><p>Next phase: secure LiveKit token server, push notifications, recording storage, and mobile wrappers.</p></Card></div>;
}

export function PrototypeAuditPage() {
  return <div className="page-grid"><Card><h1>Prototype Audit</h1><p>Current stable baseline: Supabase Auth, Request Access, Owner Approvals, roles, templates, meeting schedule, waiting room, security events.</p></Card></div>;
}

export function SecurityTestPlanPage() {
  return <div className="page-grid"><Card><h1>Security Test Plan</h1><p>Test member restrictions, servant permissions, owner-only lockdown, and revoked servant access.</p></Card></div>;
}

export function DeployTestPage() {
  return <div className="page-grid"><Card><h1>Deploy Test</h1><p>If this page renders after Vercel deploy, routing and build are alive.</p></Card></div>;
}
