import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { mockAccessRequests } from "../data/mockAccessRequests";

export function ApprovalsPage() {
  return (
    <div className="page-grid">
      <Card>
        <h1>Owner Approval Panel</h1>
        <p>First-time users remain Pending until approved, rejected, blocked, or asked for more information.</p>
      </Card>
      {mockAccessRequests.map((request) => (
        <Card key={request.id}>
          <h2>{request.fullName}</h2>
          <p>{request.email} · {request.country} · {request.relationship}</p>
          <p>{request.reason}</p>
          <div className="button-row">
            <Button>Approve as Member</Button>
            <Button variant="secondary">Approve as Servant</Button>
            <Button variant="secondary">Request More Info</Button>
            <Button variant="danger">Reject / Block</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
