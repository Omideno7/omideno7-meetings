import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { roleLabel } from "../services/roleAccess";

export function PendingApprovalPage() {
  const { logout, refreshProfile, authLoading, profile } = useAppState();

  const statusText =
    profile?.status === "blocked" ? "This account is blocked. Contact the church owner." :
    profile?.status === "rejected" ? "This access request was rejected. Contact the church owner if this is a mistake." :
    profile?.status === "suspended" ? "This account is suspended." :
    "Your account is created, but it must be approved by Apostle Yuhana before you can enter OmideNo7 Meetings.";

  return (
    <div className="public-page">
      <Card className="auth-card">
        <h1>Pending Approval</h1>
        <p>{statusText}</p>
        {profile?.email && <p><b>Email:</b> {profile.email}</p>}
        <div className="info-grid">
          <span>Current role</span><strong>{roleLabel(profile?.role)}</strong>
          <span>Current status</span><strong>{profile?.status || "pending"}</strong>
        </div>
        <p className="small-note">
          If the Owner has already approved this account, press Check Approval Status. The app will sync the approved access request with your profile.
        </p>
        <div className="stack">
          <Button onClick={refreshProfile} disabled={authLoading}>{authLoading ? "Checking..." : "Check Approval Status"}</Button>
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </Card>
    </div>
  );
}
