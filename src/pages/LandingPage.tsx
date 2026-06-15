import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";

export function LandingPage() {
  const { setRoute } = useAppState();

  return (
    <div className="public-page">
      <Card className="hero-card">
        <img className="hero-logo" src="/omideno7-logo.png" alt="OmideNo7 Meetings" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        <h1>OmideNo7 Meetings</h1>
        <p>Secure church meetings for approved OmideNo7 members and delegated servants.</p>
        <div className="button-row">
          <Button onClick={() => setRoute("login")}>Login</Button>
          <Button variant="secondary" onClick={() => setRoute("requestAccess")}>Request Access</Button>
          <Button variant="ghost" onClick={() => setRoute("installApp")}>Install App</Button>
        </div>
        <small>Public users cannot see meeting links, codes, recordings, reports, or member data.</small>
      </Card>
    </div>
  );
}
