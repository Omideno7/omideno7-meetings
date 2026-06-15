import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { dataMode } from "../config/dataMode";
import { demoStore } from "../services/demoStore";
import {
  servantRoles,
  supabaseApprovalService,
  type AccessRequestStatus,
  type ServantRole,
  type SupabaseAccessRequest
} from "../services/supabaseApprovalService";

function normalizeLocal(item: any): SupabaseAccessRequest {
  return {
    id: item.id,
    full_name: item.fullName || item.full_name || "Unknown",
    email: item.email || "",
    country: item.country,
    relationship: item.relationship,
    reason: item.reason,
    status: item.status || "pending",
    approved_role: item.approvedRole || item.approved_role,
    risk: item.risk,
    created_at: item.createdAt || item.created_at,
    decision_note: item.decision_note
  };
}

function statusLabel(request: SupabaseAccessRequest) {
  if (request.status === "approved" && request.approved_role) {
    return `APPROVED AS ${request.approved_role.replaceAll("_", " ").toUpperCase()}`;
  }
  return request.status.toUpperCase().replace("_", " ");
}

function statusClass(request: SupabaseAccessRequest) {
  return `status-badge status-${request.status}`;
}

export function ApprovalsPage() {
  const [requests, setRequests] = useState<SupabaseAccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRoleById, setSelectedRoleById] = useState<Record<string, ServantRole>>({});

  async function load() {
    setLoading(true);
    setMessage("");

    if (dataMode === "supabase") {
      const result = await supabaseApprovalService.listRequests();

      if (result.error) {
        setMessage(`Supabase read error: ${result.error}`);
        setRequests([]);
      } else {
        setRequests(result.data);
        if (result.data.length === 0) {
          setMessage("No Supabase access requests found yet. Submit a new Request Access form.");
        }
      }

      setLoading(false);
      return;
    }

    const local = demoStore.getAccessRequests ? demoStore.getAccessRequests() : [];
    setRequests((local as any[]).map(normalizeLocal));
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const byStatus: Record<string, SupabaseAccessRequest[]> = {
      pending: [],
      approved: [],
      more_info: [],
      rejected: [],
      blocked: []
    };

    requests.forEach((request) => {
      const status = request.status || "pending";
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(request);
    });

    return byStatus;
  }, [requests]);

  function selectedRole(id: string): ServantRole {
    return selectedRoleById[id] || "approved_member";
  }

  async function decide(id: string, status: AccessRequestStatus, role: ServantRole = "approved_member") {
    setLoading(true);
    setMessage("");

    if (dataMode === "supabase") {
      const result = await supabaseApprovalService.decideRequest(
        id,
        status,
        role,
        status === "more_info" ? "Owner requested more information." : ""
      );

      if (result.error) {
        setMessage(`Supabase decision error: ${result.error}`);
        setLoading(false);
        return;
      }

      await load();
      setLoading(false);
      return;
    }

    if (demoStore.updateAccessRequest) {
      demoStore.updateAccessRequest(id, { status, approvedRole: role });
    }

    await load();
    setLoading(false);
  }

  async function addDemoRequests() {
    setLoading(true);

    if (dataMode === "supabase") {
      const result = await supabaseApprovalService.addDemoRequests();
      setMessage(result.error || "Demo requests added in Supabase.");
      await load();
      setLoading(false);
      return;
    }

    if (demoStore.resetAccessDemo) {
      demoStore.resetAccessDemo();
      setMessage("Local demo requests reset.");
    }

    await load();
    setLoading(false);
  }

  function RequestCard({ request }: { request: SupabaseAccessRequest }) {
    const isPending = request.status === "pending" || request.status === "more_info";

    return (
      <Card className="approval-card">
        <div className="approval-head">
          <div>
            <h2>{request.full_name}</h2>
            <p>{request.email} · {request.country || "Unknown country"} · {request.relationship || "No relationship"}</p>
          </div>
          <span className={statusClass(request)}>{statusLabel(request)}</span>
        </div>

        {request.reason && <p>{request.reason}</p>}

        {request.account_profile_id ? (
          <p className="matched-account">Matched account profile found.</p>
        ) : request.status === "approved" ? (
          <p className="unmatched-account">Approved request, but user still needs to create/sign in with the same email.</p>
        ) : null}

        {isPending && (
          <>
            <div className="role-picker">
              <label>Approval role</label>
              <select
                value={selectedRole(request.id)}
                onChange={(event) =>
                  setSelectedRoleById((current) => ({
                    ...current,
                    [request.id]: event.target.value as ServantRole
                  }))
                }
              >
                {servantRoles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div className="button-row">
              <Button disabled={loading} onClick={() => decide(request.id, "approved", "approved_member")}>Approve as Member</Button>
              <Button disabled={loading} variant="secondary" onClick={() => decide(request.id, "approved", selectedRole(request.id))}>Approve as Servant</Button>
              <Button disabled={loading} variant="ghost" onClick={() => decide(request.id, "more_info", selectedRole(request.id))}>Request More Info</Button>
              <Button disabled={loading} variant="danger" onClick={() => decide(request.id, "rejected", selectedRole(request.id))}>Reject</Button>
              <Button disabled={loading} variant="danger" onClick={() => decide(request.id, "blocked", selectedRole(request.id))}>Block</Button>
            </div>
          </>
        )}
      </Card>
    );
  }

  return (
    <div className="page-grid">
      <Card>
        <h1>Owner Approval Panel</h1>
        <p>First-time users remain Pending until approved, rejected, blocked, or asked for more information.</p>
        <p className="small-note">Data mode: {dataMode}</p>
        <div className="button-row">
          <Button onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh Requests"}</Button>
          <Button variant="secondary" onClick={addDemoRequests} disabled={loading}>Add Demo Requests</Button>
        </div>
        {message && <p className="auth-message">{message}</p>}
      </Card>

      <section className="approval-section">
        <h2>Pending Requests</h2>
        {grouped.pending.length ? grouped.pending.map((request) => <RequestCard key={request.id} request={request} />) : <p>No pending requests.</p>}
      </section>

      <section className="approval-section">
        <h2>Approved Members / Servants</h2>
        {grouped.approved.length ? grouped.approved.map((request) => <RequestCard key={request.id} request={request} />) : <p>No approved requests yet.</p>}
      </section>

      <section className="approval-section">
        <h2>More Information Requested</h2>
        {grouped.more_info.length ? grouped.more_info.map((request) => <RequestCard key={request.id} request={request} />) : <p>No requests waiting for more information.</p>}
      </section>

      <section className="approval-section">
        <h2>Rejected / Blocked Archive</h2>
        {[...grouped.rejected, ...grouped.blocked].length
          ? [...grouped.rejected, ...grouped.blocked].map((request) => <RequestCard key={request.id} request={request} />)
          : <p>No rejected or blocked requests.</p>}
      </section>
    </div>
  );
}
