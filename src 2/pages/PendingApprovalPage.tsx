import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";

export function PendingApprovalPage() {
  const { logout, refreshProfile, authLoading, profile } = useAppState();

  return (
    <div className="public-page">
      <Card className="auth-card">
        <h1>Pending Approval</h1>
        <p>Your account is created, but it must be approved by Apostle Yuhana before you can enter OmideNo7 Meetings.</p>
        {profile?.email && <p><b>Email:</b> {profile.email}</p>}
        <div className="stack">
          <Button onClick={refreshProfile} disabled={authLoading}>{authLoading ? "Checking..." : "Check Approval Status"}</Button>
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </Card>
    </div>
  );
}
