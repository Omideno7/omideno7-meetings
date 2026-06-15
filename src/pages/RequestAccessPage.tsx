import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";

export function RequestAccessPage() {
  const { setRoute } = useAppState();

  return (
    <div className="public-page">
      <Card className="auth-card">
        <h1>Request Access</h1>
        <p>New users stay Pending until Apostle Yuhana approves them in the Owner Approval Panel.</p>
        <div className="form-grid">
          <input placeholder="Full name" />
          <input placeholder="Email" />
          <input placeholder="Country" />
          <input placeholder="Relationship to church" />
          <textarea placeholder="Reason for requesting access" />
        </div>
        <Button onClick={() => setRoute("pendingApproval")}>Submit Request</Button>
      </Card>
    </div>
  );
}
