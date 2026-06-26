import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { demoStore } from "../services/demoStore";
import { dataMode } from "../config/dataMode";
import { supabaseAccessRequestService } from "../services/supabaseAccessRequestService";

export function RequestAccessPage() {
  const { setRoute } = useAppState();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    country: "",
    relationship: "",
    reason: ""
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    setSubmitting(true);
    setMessage("");

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      country: form.country.trim(),
      relationship: form.relationship.trim(),
      reason: form.reason.trim()
    };

    if (!payload.fullName || !payload.email) {
      setMessage("Full name and email are required.");
      setSubmitting(false);
      return;
    }

    if (dataMode === "supabase") {
      const result = await supabaseAccessRequestService.submitRequest({
        full_name: payload.fullName,
        email: payload.email,
        country: payload.country || "Croatia",
        relationship: payload.relationship || "Church visitor",
        reason: payload.reason || "I want to request access to OmideNo7 Meetings."
      });

      if (result.error) {
        setMessage(`Supabase error: ${result.error}`);
        setSubmitting(false);
        return;
      }

      setMessage("Request saved in Supabase. Owner can now see it in Approvals.");
    } else {
      demoStore.submitRequest({
        fullName: payload.fullName,
        email: payload.email,
        country: payload.country || "Croatia",
        relationship: payload.relationship || "Church visitor",
        reason: payload.reason || "I want to request access to OmideNo7 Meetings."
      });
      setMessage("Request saved in local demo mode.");
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="public-page">
        <Card className="auth-card">
          <h1>Request Sent</h1>
          <p>{message}</p>
          <p>Status: Pending Approval</p>
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
        <h1>Servant / Host Access Request</h1>
        <p>Use this form only when someone needs a servant or host role. Normal members should use Create Account; their access request is sent automatically.</p>
        <p className="small-note">Data mode: {dataMode}</p>

        <div className="form-grid">
          <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Full name" />
          <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Email" />
          <input value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="Country" />
          <input value={form.relationship} onChange={(e) => update("relationship", e.target.value)} placeholder="Requested role or relationship" />
          <textarea value={form.reason} onChange={(e) => update("reason", e.target.value)} placeholder="Reason / ministry responsibility" />
        </div>

        {message && <p className="auth-message">{message}</p>}

        <div className="button-row">
          <Button onClick={submit} disabled={submitting}>{submitting ? "Saving..." : "Submit Servant Request"}</Button>
          <Button variant="ghost" onClick={() => setRoute("login")}>Back to Login</Button>
        </div>
      </Card>
    </div>
  );
}
