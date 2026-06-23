import { useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { dataMode } from "../config/dataMode";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { getRealMeetingReadiness } from "../services/realMeetingService";
import { qaReportService, type QaIssue } from "../services/qaReportService";

type ChecklistItem = {
  id: string;
  area: string;
  title: string;
  instruction: string;
  owner: string;
  priority: "high" | "medium" | "low";
};

const qaChecklist: ChecklistItem[] = [
  {
    id: "auth-owner",
    area: "Access",
    title: "Owner login",
    instruction: "Owner signs in and reaches Owner/Home without seeing pending approval.",
    owner: "Apostle Yuhana",
    priority: "high"
  },
  {
    id: "request-access",
    area: "Access",
    title: "Request Access flow",
    instruction: "A new person submits request access and the request appears in Approvals.",
    owner: "Owner",
    priority: "high"
  },
  {
    id: "approval-member",
    area: "Approvals",
    title: "Approve as member",
    instruction: "Approve one test user as member and confirm they can see Join/Waiting Room but not Owner controls.",
    owner: "Owner",
    priority: "high"
  },
  {
    id: "approval-servant",
    area: "Approvals",
    title: "Approve as servant",
    instruction: "Approve one servant role and confirm delegated controls appear only for that role.",
    owner: "Owner",
    priority: "high"
  },
  {
    id: "meeting-custom",
    area: "Schedule",
    title: "Custom meeting",
    instruction: "Create a custom meeting title and confirm it appears correctly in the schedule.",
    owner: "Host",
    priority: "high"
  },
  {
    id: "meeting-recurring",
    area: "Schedule",
    title: "Recurring meeting series",
    instruction: "Create weekly meeting and confirm it shows as one clean series card, not repeated clutter.",
    owner: "Host",
    priority: "high"
  },
  {
    id: "waiting-live",
    area: "Waiting Room",
    title: "Waiting Room inside Live Meeting",
    instruction: "Confirm waiting badge appears, name/ID is visible, Admit removes the person from waiting list and adds participant.",
    owner: "Door Servant",
    priority: "high"
  },
  {
    id: "live-chat",
    area: "Live Meeting",
    title: "Chat send and scroll",
    instruction: "Send messages by Enter and Send button; confirm message appears and panel does not overflow on laptop/mobile.",
    owner: "Chat Moderator",
    priority: "high"
  },
  {
    id: "live-reactions",
    area: "Live Meeting",
    title: "Reactions and raise hand",
    instruction: "Send heart/like effect and raise hand; confirm hand appears on main tile and attendee list.",
    owner: "Host",
    priority: "high"
  },
  {
    id: "mic-controls",
    area: "Live Meeting",
    title: "Mic controls",
    instruction: "Test Mic controls menu: mute all, allow all, lock all, lecture mode.",
    owner: "Host",
    priority: "high"
  },
  {
    id: "participant-menu",
    area: "Live Meeting",
    title: "Participant context menu",
    instruction: "Click participant tile and test message, make co-host, move room, remove, block/unblock UI.",
    owner: "Host",
    priority: "medium"
  },
  {
    id: "device-test",
    area: "Media",
    title: "Audio / Video Test",
    instruction: "Allow devices, choose camera/microphone/speaker, test front/back camera, mic level, and apply selected devices.",
    owner: "Media Servant",
    priority: "high"
  },
  {
    id: "profile-edit",
    area: "Profile",
    title: "Profile edit",
    instruction: "Change display name and choose profile image from mobile gallery/computer.",
    owner: "Member",
    priority: "medium"
  },
  {
    id: "reports",
    area: "Reports",
    title: "Reports and audit",
    instruction: "Confirm host/owner reports and audit pages are accessible only to allowed roles.",
    owner: "Owner",
    priority: "medium"
  },
  {
    id: "security",
    area: "Security",
    title: "Role restrictions",
    instruction: "Member account must not see Owner, Security, Audit Logs, Permission Templates, or servant-only actions.",
    owner: "Owner",
    priority: "high"
  }
];

const areas = ["Live Meeting", "Waiting Room", "Schedule", "Media", "Profile", "Access", "Approvals", "Reports", "Security", "Other"];

function initialChecked() {
  try {
    return JSON.parse(localStorage.getItem("omideno7.qa.checked.v1") || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function TestingCenterPage() {
  const { profile, setRoute } = useAppState();
  const [checked, setChecked] = useState<Record<string, boolean>>(initialChecked);
  const [issues, setIssues] = useState<QaIssue[]>(() => qaReportService.list());
  const [message, setMessage] = useState("Ready for servant testing.");
  const readiness = getRealMeetingReadiness();

  const [form, setForm] = useState({
    reporter: profile?.displayName || "Apostle Yuhana",
    area: "Live Meeting",
    severity: "medium" as QaIssue["severity"],
    title: "",
    steps: "",
    expected: "",
    actual: ""
  });

  const completed = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);
  const percent = Math.round((completed / qaChecklist.length) * 100);

  function updateChecked(id: string, value: boolean) {
    const next = { ...checked, [id]: value };
    setChecked(next);
    localStorage.setItem("omideno7.qa.checked.v1", JSON.stringify(next));
  }

  function submitIssue() {
    if (!form.title.trim()) {
      setMessage("Write a short issue title first.");
      return;
    }

    const issue = qaReportService.add({
      reporter: form.reporter.trim() || profile?.displayName || "Tester",
      area: form.area,
      severity: form.severity,
      title: form.title.trim(),
      steps: form.steps.trim(),
      expected: form.expected.trim(),
      actual: form.actual.trim()
    });

    setIssues(qaReportService.list());
    setMessage(`Issue saved: ${issue.title}`);
    setForm({ ...form, title: "", steps: "", expected: "", actual: "" });
  }

  async function copyReport() {
    const text = qaReportService.exportText();
    try {
      await navigator.clipboard.writeText(text);
      setMessage("QA report copied. Paste it in ChatGPT or send it to the developer.");
    } catch {
      setMessage("Copy failed. Use the export text manually.");
    }
  }

  function downloadReport() {
    const blob = new Blob([qaReportService.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `omideno7-qa-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("QA report downloaded.");
  }

  function updateStatus(id: string, status: QaIssue["status"]) {
    qaReportService.updateStatus(id, status);
    setIssues(qaReportService.list());
  }

  function removeIssue(id: string) {
    qaReportService.remove(id);
    setIssues(qaReportService.list());
  }

  function resetChecklist() {
    if (!confirm("Reset QA checklist?")) return;
    localStorage.removeItem("omideno7.qa.checked.v1");
    setChecked({});
    setMessage("Checklist reset.");
  }

  return (
    <div className="page-grid qa-page">
      <Card>
        <div className="qa-hero">
          <div>
            <h1>Testing Center</h1>
            <p>Use this page for the full test meeting with servants. Test each section, record issues, export the report, then we fix items one by one.</p>
          </div>
          <div className="qa-score">
            <strong>{percent}%</strong>
            <span>{completed}/{qaChecklist.length} checks</span>
          </div>
        </div>
        <div className="qa-progress-track">
          <div style={{ width: `${percent}%` }} />
        </div>
        <p className="auth-message">{message}</p>
        <div className="button-row">
          <Button onClick={() => setRoute("meetingSchedule")}>Start Schedule Test</Button>
          <Button variant="secondary" onClick={() => setRoute("liveMeeting")}>Open Live Meeting</Button>
          <Button variant="secondary" onClick={() => setRoute("deviceTest")}>Open Media Test</Button>
          <Button variant="ghost" onClick={resetChecklist}>Reset Checklist</Button>
        </div>
      </Card>

      <div className="dashboard-grid qa-status-grid">
        <Card>
          <h2>Environment</h2>
          <div className="info-grid">
            <span>Data mode</span><strong>{dataMode}</strong>
            <span>Supabase</span><strong>{isSupabaseConfigured ? "configured" : "not configured"}</strong>
            <span>Signed in</span><strong>{profile?.displayName || "No profile"}</strong>
            <span>Role</span><strong>{profile?.role?.replaceAll("_", " ") || "unknown"}</strong>
          </div>
        </Card>
        <Card>
          <h2>LiveKit readiness</h2>
          <div className="info-grid">
            <span>Mode</span><strong>{readiness.mode}</strong>
            <span>Configured</span><strong>{readiness.configured ? "yes" : "not yet"}</strong>
            <span>Room</span><strong>{readiness.defaultRoom}</strong>
            <span>Missing</span><strong>{readiness.missing.length ? readiness.missing.join(", ") : "none"}</strong>
          </div>
        </Card>
      </div>

      <Card>
        <h2>Servant test script</h2>
        <ol className="qa-script">
          <li>Owner signs in and opens Testing Center on laptop.</li>
          <li>One servant signs in as host/co-host; one member signs in from phone.</li>
          <li>Member enters Waiting Room; Door Servant admits/rejects from Live Meeting.</li>
          <li>Host tests mic controls, lecture mode, chat modes, reactions, raise hand, and participant menu.</li>
          <li>Media Servant tests camera/mic/speaker device selection.</li>
          <li>Everyone writes problems into the QA Issue form below.</li>
          <li>Owner exports the report and sends it for next repair phase.</li>
        </ol>
      </Card>

      <Card>
        <h2>QA checklist</h2>
        <div className="qa-checklist">
          {qaChecklist.map((item) => (
            <label key={item.id} className={`qa-check-item priority-${item.priority}`}>
              <input type="checkbox" checked={Boolean(checked[item.id])} onChange={(event) => updateChecked(item.id, event.target.checked)} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.area} · {item.owner} · {item.priority}</span>
                <p>{item.instruction}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2>Record an issue</h2>
        <div className="qa-form-grid">
          <label>Reporter<input value={form.reporter} onChange={(event) => setForm({ ...form, reporter: event.target.value })} /></label>
          <label>Area<select value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })}>{areas.map((area) => <option key={area}>{area}</option>)}</select></label>
          <label>Severity<select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value as QaIssue["severity"] })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
          <label className="span-3">Issue title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Example: Send button is hidden on laptop" /></label>
          <label className="span-3">Steps to reproduce<textarea value={form.steps} onChange={(event) => setForm({ ...form, steps: event.target.value })} /></label>
          <label className="span-3">Expected result<textarea value={form.expected} onChange={(event) => setForm({ ...form, expected: event.target.value })} /></label>
          <label className="span-3">Actual result<textarea value={form.actual} onChange={(event) => setForm({ ...form, actual: event.target.value })} /></label>
        </div>
        <div className="button-row">
          <Button onClick={submitIssue}>Save Issue</Button>
          <Button variant="secondary" onClick={copyReport}>Copy Report</Button>
          <Button variant="secondary" onClick={downloadReport}>Download JSON</Button>
          <Button variant="ghost" onClick={() => { if (confirm("Clear all issues?")) { qaReportService.clear(); setIssues([]); } }}>Clear Issues</Button>
        </div>
      </Card>

      <Card>
        <h2>Issues list ({issues.length})</h2>
        {issues.length === 0 ? (
          <p>No issues recorded yet.</p>
        ) : (
          <div className="qa-issues-list">
            {issues.map((issue) => (
              <article key={issue.id} className={`qa-issue severity-${issue.severity}`}>
                <div>
                  <strong>{issue.title}</strong>
                  <span>{issue.area} · {issue.severity} · {issue.status}</span>
                  <p>{issue.actual || issue.steps || "No detail."}</p>
                </div>
                <div className="qa-issue-actions">
                  <button onClick={() => updateStatus(issue.id, "open")}>Open</button>
                  <button onClick={() => updateStatus(issue.id, "review")}>Review</button>
                  <button onClick={() => updateStatus(issue.id, "fixed")}>Fixed</button>
                  <button onClick={() => removeIssue(issue.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
