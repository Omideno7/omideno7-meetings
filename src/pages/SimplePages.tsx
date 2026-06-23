import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { getRealMeetingReadiness } from "../services/realMeetingService";

export function NotificationsPage() {
  return <div className="page-grid"><Card><h1>Notifications</h1><p>Meeting reminders, owner alerts, approval notifications, waiting room alerts, and schedule reminders will appear here.</p></Card></div>;
}

export function InboxPage() {
  return <div className="page-grid"><Card><h1>Inbox</h1><p>Approved members can receive church messages, meeting updates, and admin notices here.</p></Card></div>;
}

export function MediaLibraryPage() {
  return (
    <div className="page-grid">
      <Card><h1>Media Library</h1><p>Recordings archive will store MP4, MP3, transcript, subtitles, and publishing status after the recording backend is connected.</p></Card>
      <div className="dashboard-grid">
        <Card><h2>Video archive</h2><p>Meeting recordings will be stored privately and published only by allowed host/owner roles.</p></Card>
        <Card><h2>Audio archive</h2><p>Audio-only versions for sermons and teaching can be generated later.</p></Card>
        <Card><h2>Permissions</h2><p>Members should only see recordings approved for them.</p></Card>
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
          <Button variant="secondary" onClick={() => setRoute("testingCenter")}>Open Testing Center</Button>
          <Button variant="secondary" onClick={() => setRoute("meetingSchedule")}>Meeting Schedule</Button>
        </div>
      </Card>
      <div className="dashboard-grid">
        <Card><h2>Attendance</h2><p>Shows who joined, how long they stayed, reconnect count, and quality after real meeting engine is connected.</p></Card>
        <Card><h2>Waiting Room</h2><p>Tracks admitted, rejected, removed, blocked, and late arrivals.</p></Card>
        <Card><h2>Servant Activity</h2><p>Owner can audit host actions and delegated controls.</p></Card>
      </div>
    </div>
  );
}

export function LiveKitSetupPage() {
  const readiness = getRealMeetingReadiness();

  return (
    <div className="page-grid">
      <Card>
        <h1>LiveKit Setup</h1>
        <p>LiveKit is the real audio/video engine phase. The current app UI is ready for QA, but true multi-user video/audio needs these backend settings.</p>
      </Card>
      <div className="dashboard-grid">
        <Card>
          <h2>Current status</h2>
          <div className="info-grid">
            <span>Mode</span><strong>{readiness.mode}</strong>
            <span>Configured</span><strong>{readiness.configured ? "yes" : "not yet"}</strong>
            <span>Room</span><strong>{readiness.defaultRoom}</strong>
            <span>Missing</span><strong>{readiness.missing.length ? readiness.missing.join(", ") : "none"}</strong>
          </div>
        </Card>
        <Card>
          <h2>Required environment variables</h2>
          <code>VITE_LIVEKIT_WS_URL</code>
          <code>VITE_LIVEKIT_TOKEN_ENDPOINT</code>
          <code>VITE_LIVEKIT_DEFAULT_ROOM</code>
        </Card>
      </div>
      <Card>
        <h2>Backend still required</h2>
        <p>A secure token endpoint must be created on a server. The browser must never contain the LiveKit secret key. Owner/approved-user checks must happen before token generation.</p>
      </Card>
    </div>
  );
}

export function ProductionRoadmapPage() {
  return (
    <div className="page-grid">
      <Card><h1>Production Roadmap</h1><p>Next phase: secure LiveKit token server, real WebRTC rooms, push notifications, recording storage, and mobile wrappers.</p></Card>
      <div className="dashboard-grid">
        <Card><h2>Phase A</h2><p>Internal servant QA and bug report export.</p></Card>
        <Card><h2>Phase B</h2><p>LiveKit real meeting engine and secure token backend.</p></Card>
        <Card><h2>Phase C</h2><p>Recording, notifications, and app store readiness.</p></Card>
      </div>
    </div>
  );
}

export function PrototypeAuditPage() {
  return <div className="page-grid"><Card><h1>Prototype Audit</h1><p>Current QA-ready baseline: Supabase Auth, Request Access, Owner Approvals, roles, templates, meeting schedule, waiting room, security events, live meeting UI, testing center.</p></Card></div>;
}

export function SecurityTestPlanPage() {
  return (
    <div className="page-grid">
      <Card><h1>Security Test Plan</h1><p>Test member restrictions, servant permissions, owner-only lockdown, revoked servant access, and private member data exposure.</p></Card>
      <div className="dashboard-grid">
        <Card><h2>Member test</h2><p>Member must not see owner/security/permission pages.</p></Card>
        <Card><h2>Servant test</h2><p>Servant must only see controls allowed by role/template.</p></Card>
        <Card><h2>Owner test</h2><p>Owner must be able to revoke access immediately.</p></Card>
      </div>
    </div>
  );
}

export function DeployTestPage() {
  return <div className="page-grid"><Card><h1>Deploy Test</h1><p>If this page renders after Vercel deploy, routing and build are alive.</p></Card></div>;
}
