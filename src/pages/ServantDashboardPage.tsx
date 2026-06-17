import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { hasPermission, permissions } from "../config/permissions";

function labelPermission(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export function ServantDashboardPage() {
  const { profile, setRoute } = useAppState();
  const role = profile?.role || "approved_member";
  const allowed = Object.keys(permissions).filter((key) => hasPermission(role as any, key as any));
  const restricted = Object.keys(permissions).filter((key) => !hasPermission(role as any, key as any));

  return (
    <div className="page-grid">
      <Card>
        <h1>Servant Dashboard</h1>
        <p>This page shows what the current delegated account is allowed to do. Servants never use the church master password.</p>
        <p className="small-note">Current role: <strong>{role.replaceAll("_", " ")}</strong></p>
        <div className="button-row">
          <Button onClick={() => setRoute("meetingSchedule")}>Open Meeting Schedule</Button>
          <Button variant="secondary" onClick={() => setRoute("waitingRoom")}>Open Waiting Room</Button>
          <Button variant="secondary" onClick={() => setRoute("reports")}>Reports</Button>
        </div>
      </Card>

      <div className="dashboard-grid">
        <Card>
          <h2>Allowed Controls</h2>
          {allowed.length ? <ul>{allowed.map((item) => <li key={item}>✅ {labelPermission(item)}</li>)}</ul> : <p>No servant permissions enabled.</p>}
        </Card>
        <Card>
          <h2>Restricted Controls</h2>
          <ul>{restricted.slice(0, 12).map((item) => <li key={item}>🔒 {labelPermission(item)}</li>)}</ul>
          <p>Emergency Lockdown always remains Owner-only.</p>
        </Card>
      </div>
    </div>
  );
}
