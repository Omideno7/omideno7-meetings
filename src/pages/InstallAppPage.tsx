import { Card } from "../components/ui/Card";
import { InstallAppCard } from "../components/ui/InstallAppCard";

export function InstallAppPage() {
  return (
    <div className="page-grid">
      <Card>
        <h1>Install App</h1>
        <p>This page prepares the test installation flow for iPhone, Android and desktop browsers.</p>
      </Card>
      <InstallAppCard />
      <Card>
        <h2>Important</h2>
        <p>This is a test PWA install. Real Supabase, LiveKit, push notifications and store release will come later.</p>
      </Card>
    </div>
  );
}
