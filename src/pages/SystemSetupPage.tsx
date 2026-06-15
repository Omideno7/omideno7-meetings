import { Card } from "../components/ui/Card";
import { environment, isSupabaseConfigured, isLiveKitConfigured } from "../config/environment";

export function SystemSetupPage() {
  return (
    <div className="page-grid">
      <Card><h1>System Setup</h1><p>Owner-only environment and backend setup status.</p></Card>
      <Card><h2>Supabase</h2><p>{isSupabaseConfigured ? "Configured" : "Not connected yet"}</p></Card>
      <Card><h2>LiveKit</h2><p>{isLiveKitConfigured ? "Configured" : "Not connected yet"}</p></Card>
      <Card><h2>Owner</h2><p>{environment.ownerName}</p></Card>
    </div>
  );
}
