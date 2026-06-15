import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";

export function OwnerDashboardPage() {
  const { setRoute } = useAppState();

  return (
    <div className="page-grid">
      <Card>
        <h1>Owner Dashboard</h1>
        <p>Welcome Apostle Yuhana. This area controls approvals, servants, meetings, reports, security, recordings, and production setup.</p>
      </Card>
      <Card><h2>Pending Requests</h2><p>2 requests waiting.</p><Button onClick={() => setRoute("approvals")}>Open Approvals</Button></Card>
      <Card><h2>Security</h2><p>Emergency Lockdown remains Owner-only.</p><Button variant="danger">Emergency Lockdown</Button></Card>
      <Card><h2>Production</h2><p>React conversion starter is active.</p><div className="button-row"><Button variant="secondary" onClick={() => setRoute("productionRoadmap")}>Roadmap</Button><Button variant="secondary" onClick={() => setRoute("deployTest")}>Deploy Test</Button></div></Card>
    </div>
  );
}
