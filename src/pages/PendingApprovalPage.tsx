import { Card } from "../components/ui/Card";

export function PendingApprovalPage() {
  return (
    <div className="public-page">
      <Card className="auth-card">
        <h1>Pending Approval</h1>
        <p>Your request is waiting for Owner approval. Until approval, you cannot see meetings, links, recordings, reports, or member data.</p>
      </Card>
    </div>
  );
}
