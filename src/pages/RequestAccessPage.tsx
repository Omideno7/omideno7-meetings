import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { demoStore } from "../services/demoStore";

export function RequestAccessPage() {
  const { setRoute } = useAppState();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", country: "", relationship: "", reason: "" });

  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  function submit() {
    const fullName = form.fullName.trim() || "New Test User";
    const email = form.email.trim() || `test-${Date.now()}@example.com`;
    demoStore.submitRequest({
      ...form,
      fullName,
      email,
      country: form.country.trim() || "Croatia",
      relationship: form.relationship.trim() || "Church visitor",
      reason: form.reason.trim() || "I want to request access to OmideNo7 Meetings."
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="public-page">
        <Card className="auth-card">
          <h1>Request Sent</h1>
          <p>Your request was saved in the demo system. Login as Apostle Yuhana / Owner and open Approvals to see it.</p>
          <div className="button-row">
            <Button onClick={() => setRoute("login")}>Go to Login</Button>
            <Button variant="secondary" onClick={() => setRoute("pendingApproval")}>Pending Page</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="public-page">
      <Card className="auth-card">
        <h1>Request Access</h1>
        <p>New users stay Pending until Apostle Yuhana approves them in the Owner Approval Panel.</p>
        <div className="form-grid">
          <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Full name" />
          <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Email" />
          <input value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="Country" />
          <input value={form.relationship} onChange={(e) => update("relationship", e.target.value)} placeholder="Relationship to church" />
          <textarea value={form.reason} onChange={(e) => update("reason", e.target.value)} placeholder="Reason for requesting access" />
        </div>
        <div className="button-row">
          <Button onClick={submit}>Submit Request</Button>
          <Button variant="ghost" onClick={() => setRoute("login")}>Back to Login</Button>
        </div>
      </Card>
    </div>
  );
}
