import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { demoStore } from "../services/demoStore";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";

export function ApprovalsPage() {
  useDemoStoreVersion();
  const requests = demoStore.listRequests();

  return (
    <div className="page-grid">
      <Card><h1>Owner Approval Panel</h1><p>First-time users remain Pending until approved, rejected, blocked, or asked for more information.</p></Card>
      {requests.length === 0 ? <Card><p>No requests yet. Submit a request from the public Request Access page.</p></Card> : requests.map((request) => (
        <Card key={request.id} className={`status-card status-${request.status}`}>
          <div className="section-row">
            <div><h2>{request.fullName}</h2><p>{request.email} · {request.country} · {request.relationship}</p><p>{request.reason}</p></div>
            <span className={`status-pill ${request.status}`}>{request.status}</span>
          </div>
          <div className="button-row">
            <Button onClick={() => demoStore.updateRequest(request.id, "approved", "approved_member")}>Approve as Member</Button>
            <Button variant="secondary" onClick={() => demoStore.updateRequest(request.id, "approved", "media_servant")}>Approve as Servant</Button>
            <Button variant="secondary" onClick={() => demoStore.updateRequest(request.id, "more_info")}>Request More Info</Button>
            <Button variant="danger" onClick={() => demoStore.updateRequest(request.id, "rejected")}>Reject</Button>
            <Button variant="danger" onClick={() => demoStore.updateRequest(request.id, "blocked")}>Block</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
