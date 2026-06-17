import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { supabaseAdminService, type AuditRow } from "../services/supabaseAdminService";

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const result = await supabaseAdminService.listAuditLogs();
    setLogs(result.data);
    setMessage(result.error || "");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page-grid">
      <Card>
        <h1>Audit Logs</h1>
        <p>Owner can review approvals, waiting room decisions, meeting changes, security actions, and servant permission changes.</p>
        <Button onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh Logs"}</Button>
        {message && <p className="auth-message">{message}</p>}
      </Card>

      {logs.map((log) => (
        <Card key={log.id}>
          <div className="section-row">
            <div>
              <h2>{log.action}</h2>
              <p>{log.entity_type} · {log.created_at ? new Date(log.created_at).toLocaleString() : ""}</p>
              <pre className="code-preview">{JSON.stringify(log.metadata || {}, null, 2)}</pre>
            </div>
          </div>
        </Card>
      ))}

      {!logs.length && <Card><p>No audit logs found yet.</p></Card>}
    </div>
  );
}
