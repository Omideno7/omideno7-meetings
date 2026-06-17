import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { supabaseAdminService } from "../services/supabaseAdminService";

export function SecurityCenterPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function action(name: string, note: string) {
    setLoading(true);
    const result = await supabaseAdminService.securityEvent(name, note);
    setMessage(result.error || `Security action logged: ${name}`);
    setLoading(false);
  }

  return (
    <div className="page-grid">
      <Card>
        <h1>Owner Security Center</h1>
        <p>Only Owner can see and use these controls. Emergency Lockdown is intentionally not available to servants.</p>
        {message && <p className="auth-message">{message}</p>}
      </Card>

      <div className="dashboard-grid">
        <Card>
          <h2>Emergency Lockdown</h2>
          <p>Immediately ends live/opening meetings in the database and records an audit event.</p>
          <Button variant="danger" disabled={loading} onClick={() => action("emergency_lockdown", "Owner activated emergency lockdown.")}>Activate Emergency Lockdown</Button>
        </Card>
        <Card>
          <h2>Security Review</h2>
          <p>Record a security-review event without closing meetings.</p>
          <Button disabled={loading} onClick={() => action("security_review", "Owner opened security review.")}>Log Security Review</Button>
        </Card>
        <Card>
          <h2>Permissions Audit</h2>
          <p>Use this before assigning servant powers or after a servant leaves.</p>
          <Button variant="secondary" disabled={loading} onClick={() => action("permissions_audit", "Owner reviewed servant permissions.")}>Log Permissions Audit</Button>
        </Card>
      </div>
    </div>
  );
}
