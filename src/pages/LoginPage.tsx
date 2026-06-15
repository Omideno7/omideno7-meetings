import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";

export function LoginPage() {
  const { loginAs, setRoute } = useAppState();

  return (
    <div className="public-page">
      <Card className="auth-card">
        <h1>Welcome Back</h1>
        <p>This React starter uses safe demo logins until Supabase Auth is connected.</p>
        <div className="stack">
          <Button onClick={() => loginAs("owner")}>Demo Login as Apostle Yuhana / Owner</Button>
          <Button variant="secondary" onClick={() => loginAs("member")}>Demo Login as Approved Member</Button>
          <Button variant="secondary" onClick={() => loginAs("pending")}>Demo Login as Pending User</Button>
          <Button variant="ghost" onClick={() => setRoute("requestAccess")}>Request Access</Button>
        </div>
      </Card>
    </div>
  );
}
