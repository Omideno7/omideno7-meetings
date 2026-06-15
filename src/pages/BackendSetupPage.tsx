import { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { backendStatusService } from "../services/backendStatusService";

export function BackendSetupPage() {
  const [result, setResult] = useState("");
  const status = backendStatusService.getStatus();
  async function test() { const response = await backendStatusService.testConnection(); setResult(response.message); }
  return (
    <div className="page-grid">
      <Card><h1>Supabase Backend Setup</h1><p>This page prepares the real backend connection for OmideNo7 Meetings.</p></Card>
      <div className="dashboard-grid">
        <Card><h2>Data Mode</h2><p>{status.dataMode}</p></Card>
        <Card><h2>Supabase</h2><p>{status.isSupabaseConfigured ? "Configured" : "Not configured yet"}</p></Card>
        <Card><h2>LiveKit</h2><p>{status.liveKitReady ? "URL configured" : "Not connected yet"}</p></Card>
        <Card><h2>Mode</h2><p>{status.message}</p></Card>
      </div>
      <Card><h2>Connection Test</h2><Button onClick={test}>Test Supabase Connection</Button>{result && <p><b>Result:</b> {result}</p>}</Card>
      <Card><h2>Setup Order</h2><ol><li>Create Supabase project.</li><li>Run SQL files 0001 to 0004.</li><li>Add variables to Vercel.</li><li>Set VITE_DATA_MODE=supabase.</li><li>Redeploy Vercel.</li></ol></Card>
    </div>
  );
}
