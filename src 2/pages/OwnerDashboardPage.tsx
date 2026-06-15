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
      <Card><h1>Owner Dashboard</h1><p>Welcome Apostle Yuhana. This area controls approvals, servants, meetings, reports, security, recordings, and production setup.</p></Card>
      <div className="dashboard-grid">
        <Card><h2>Pending Requests</h2><p>{pending} requests waiting.</p><Button onClick={() => setRoute("approvals")}>Open Approvals</Button></Card>
        <Card><h2>Waiting Room</h2><p>{waiting} people waiting.</p><Button onClick={() => setRoute("waitingRoom")}>Open Waiting Room</Button></Card>
        <Card><h2>Notifications</h2><p>{unread} unread alerts.</p><Button variant="secondary" onClick={() => setRoute("notifications")}>Open Notifications</Button></Card>
        <Card><h2>Media Library</h2><p>Demo recording, transcript, MP3 and MP4 cards.</p><Button variant="secondary" onClick={() => setRoute("mediaLibrary")}>Open Media</Button></Card>
        <Card><h2>Reports</h2><p>Attendance and connection report demo.</p><Button variant="secondary" onClick={() => setRoute("reports")}>Open Reports</Button></Card>
        <Card><h2>Security</h2><p>Emergency Lockdown remains Owner-only.</p><Button variant="danger">Emergency Lockdown</Button></Card>
        <Card><h2>Production</h2><p>React PWA test is deployed.</p><div className="button-row"><Button variant="secondary" onClick={() => setRoute("productionRoadmap")}>Roadmap</Button><Button variant="secondary" onClick={() => setRoute("deployTest")}>Deploy Test</Button></div></Card>
      </div>
    </div>
  );
}
