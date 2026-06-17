import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { demoStore } from "../services/demoStore";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";

export function OwnerDashboardPage() {
  const { setRoute } = useAppState();
  useDemoStoreVersion();
  const pending = demoStore.listRequests().filter((item) => item.status === "pending").length;
  const waiting = demoStore.listWaitingRoom().filter((item) => item.status === "waiting").length;
  const unread = demoStore.listNotifications().filter((item) => !item.read).length;

  return (
    <div className="page-grid">
      <Card>
        <h1>Owner Dashboard</h1>
        <p>Welcome Apostle Yuhana. This area controls approvals, delegated servants, meetings, waiting room, security, reports, recordings, and production setup.</p>
      </Card>

      <div className="dashboard-grid">
        <Card><h2>Pending Requests</h2><p>{pending} local demo counter. Supabase requests are inside Approvals.</p><Button onClick={() => setRoute("approvals")}>Open Approvals</Button></Card>
        <Card><h2>Permission Templates</h2><p>Assign reusable powers to servants without sharing master credentials.</p><Button onClick={() => setRoute("permissionTemplates")}>Open Permissions</Button></Card>
        <Card><h2>Meeting Schedule</h2><p>Create church-owned meetings and open rooms for members.</p><Button onClick={() => setRoute("meetingSchedule")}>Open Meetings</Button></Card>
        <Card><h2>Waiting Room</h2><p>{waiting} local demo counter. Real waiting room is Supabase-connected.</p><Button onClick={() => setRoute("waitingRoom")}>Open Waiting Room</Button></Card>
        <Card><h2>Servant Dashboard</h2><p>Preview role-based servant controls.</p><Button variant="secondary" onClick={() => setRoute("servantDashboard")}>Open Servant Panel</Button></Card>
        <Card><h2>Notifications</h2><p>{unread} unread local alerts.</p><Button variant="secondary" onClick={() => setRoute("notifications")}>Open Notifications</Button></Card>
        <Card><h2>Media Library</h2><p>Recording, transcript, MP3 and MP4 cards.</p><Button variant="secondary" onClick={() => setRoute("mediaLibrary")}>Open Media</Button></Card>
        <Card><h2>Reports</h2><p>Attendance and connection report area.</p><Button variant="secondary" onClick={() => setRoute("reports")}>Open Reports</Button></Card>
        <Card><h2>Audit Logs</h2><p>Review approvals, security actions, and meeting decisions.</p><Button variant="secondary" onClick={() => setRoute("auditLogs")}>Open Audit Logs</Button></Card>
        <Card><h2>Security</h2><p>Emergency Lockdown remains Owner-only.</p><Button variant="danger" onClick={() => setRoute("securityCenter")}>Security Center</Button></Card>
      </div>
    </div>
  );
}
