import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { dataMode } from "../config/dataMode";
import { supabaseAdminService, type MeetingRow } from "../services/supabaseAdminService";
import { useAppState } from "../app/AppState";

const meetingTypes = [
  { value: "sunday_service", label: "Sunday Service" },
  { value: "morning_prayer", label: "Morning Prayer" },
  { value: "bible_class", label: "Bible Class" },
  { value: "leadership_meeting", label: "Leadership Meeting" },
  { value: "prayer_meeting", label: "Prayer Meeting" },
  { value: "custom", label: "Custom" }
];

const recurrenceOptions = [
  { value: "once", label: "One-time meeting" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" }
];

type MeetingForm = {
  title: string;
  meetingType: string;
  customTitle: string;
  start: string;
  end: string;
  recurrenceFrequency: string;
  notes: string;
};

type MeetingGroup = {
  key: string;
  primary: MeetingRow;
  items: MeetingRow[];
  isSeries: boolean;
};

function pretty(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString();
}

function defaultEnd(start: string) {
  if (!start) return "";
  const date = new Date(start);
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 16);
}

function groupMeetings(meetings: MeetingRow[]): MeetingGroup[] {
  const map = new Map<string, MeetingRow[]>();

  meetings.forEach((meeting) => {
    const recurrence = meeting.recurrence_frequency || "once";
    const key = meeting.recurrence_group_id || (recurrence !== "once" ? `series-${meeting.title}-${meeting.meeting_type}-${meeting.scheduled_start}` : meeting.id);
    const current = map.get(key) || [];
    current.push(meeting);
    map.set(key, current);
  });

  return Array.from(map.entries()).map(([key, items]) => {
    const sorted = [...items].sort((a, b) => String(a.scheduled_start || "").localeCompare(String(b.scheduled_start || "")));
    const primary = sorted[0];
    return {
      key,
      primary,
      items: sorted,
      isSeries: sorted.length > 1 || (primary.recurrence_frequency && primary.recurrence_frequency !== "once")
    };
  });
}

export function MeetingSchedulePage() {
  const { setRoute, profile } = useAppState();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("Ready");
  const [kind, setKind] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<MeetingRow | null>(null);
  const [form, setForm] = useState<MeetingForm>({
    title: "Sunday Service",
    meetingType: "sunday_service",
    customTitle: "",
    start: "",
    end: "",
    recurrenceFrequency: "once",
    notes: ""
  });

  const isHost = Boolean(profile?.status === "approved" && profile?.role !== "approved_member");

  const groups = useMemo(() => groupMeetings(meetings), [meetings]);

  const visibleTitle = useMemo(() => {
    if (form.meetingType === "custom") return form.customTitle.trim() || "Custom Meeting";
    return form.title.trim() || meetingTypes.find((item) => item.value === form.meetingType)?.label || "Meeting";
  }, [form.meetingType, form.customTitle, form.title]);

  useEffect(() => {
    if (kind === "success" || kind === "error") {
      const timer = window.setTimeout(() => {
        setKind("idle");
        setMessage("Ready");
      }, 4500);
      return () => window.clearTimeout(timer);
    }
  }, [kind, message]);

  function show(nextKind: typeof kind, text: string) {
    setKind(nextKind);
    setMessage(text);
  }

  async function load() {
    setLoading(true);
    show("loading", "Loading meetings...");
    const result = await supabaseAdminService.listMeetings();
    setMeetings(result.data);
    show(result.error ? "error" : "success", result.error || `Loaded ${result.data.length} meeting records. Recurring meetings are collapsed into clean series cards.`);
    setLoading(false);
  }

  function startEdit(meeting: MeetingRow) {
    setEditing(meeting);
    setForm({
      title: meeting.title || "Custom Meeting",
      customTitle: meeting.meeting_type === "custom" ? meeting.title : "",
      meetingType: meeting.meeting_type || "custom",
      start: meeting.scheduled_start ? new Date(meeting.scheduled_start).toISOString().slice(0, 16) : "",
      end: meeting.scheduled_end ? new Date(meeting.scheduled_end).toISOString().slice(0, 16) : "",
      recurrenceFrequency: meeting.recurrence_frequency || "once",
      notes: meeting.notes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    show("idle", `Editing ${meeting.title}.`);
  }

  function resetForm() {
    setEditing(null);
    setForm({
      title: "Sunday Service",
      meetingType: "sunday_service",
      customTitle: "",
      start: "",
      end: "",
      recurrenceFrequency: "once",
      notes: ""
    });
    show("idle", "Ready");
  }

  async function createMeeting() {
    if (!visibleTitle.trim()) {
      show("error", "Meeting title is required.");
      return;
    }

    setLoading(true);
    show("loading", editing ? "Saving meeting changes..." : "Creating meeting...");

    if (editing) {
      const result = await supabaseAdminService.updateMeetingDetails({
        id: editing.id,
        title: visibleTitle,
        meetingType: form.meetingType,
        start: form.start,
        end: form.end,
        recurrenceFrequency: form.recurrenceFrequency,
        recurrenceLabel: recurrenceOptions.find((item) => item.value === form.recurrenceFrequency)?.label,
        notes: form.notes
      });
      show(result.error ? "error" : "success", result.error || "Meeting updated.");
      await load();
      setEditing(null);
      setLoading(false);
      return;
    }

    const result = await supabaseAdminService.createMeetingAdvanced({
      title: visibleTitle,
      meetingType: form.meetingType,
      start: form.start,
      end: form.end,
      recurrenceFrequency: form.recurrenceFrequency,
      repeatCount: 1,
      recurrenceLabel: recurrenceOptions.find((item) => item.value === form.recurrenceFrequency)?.label,
      notes: form.notes
    });

    show(result.error ? "error" : "success", result.error || `Created meeting: ${visibleTitle}. Recurring meetings now show as one series card.`);
    await load();
    setLoading(false);
  }

  async function setState(meeting: MeetingRow, patch: Partial<MeetingRow>) {
    setLoading(true);
    show("loading", "Updating meeting state...");
    const result = await supabaseAdminService.updateMeetingState({
      id: meeting.id,
      status: patch.status,
      lectureMode: patch.lecture_mode,
      lowBandwidthMode: patch.low_bandwidth_mode,
      recordingEnabled: patch.recording_enabled
    });
    show(result.error ? "error" : "success", result.error || "Meeting state updated.");
    await load();
    setLoading(false);
  }

  async function deleteMeeting(meeting: MeetingRow, scope: "single" | "series" = "single") {
    const label = scope === "series" ? "this whole series" : `"${meeting.title}"`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    setLoading(true);
    show("loading", scope === "series" ? "Deleting meeting series..." : "Deleting meeting...");
    const result = await supabaseAdminService.deleteMeeting({
      id: meeting.id,
      scope,
      recurrenceGroupId: meeting.recurrence_group_id
    });
    show(result.error ? "error" : "success", result.error || (scope === "series" ? "Meeting series deleted." : "Meeting deleted."));
    await load();
    setLoading(false);
  }

  function toggleSeries(key: string) {
    setExpandedSeries((current) => ({ ...current, [key]: !current[key] }));
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page-grid">
      {kind !== "idle" && (
        <div className={`action-toast action-${kind}`}>
          <strong>{kind === "loading" ? "Working" : kind === "success" ? "Done" : kind === "error" ? "Error" : "Status"}</strong>
          <span>{message}</span>
          <button className="toast-close" onClick={() => { setKind("idle"); setMessage("Ready"); }}>×</button>
        </div>
      )}

      <Card>
        <h1>Meeting Schedule</h1>
        <p>Create one-time or recurring meetings. Recurring meetings are shown as one clean series card instead of filling the whole panel.</p>
        <p className="small-note">Data mode: {dataMode}</p>
        <div className="button-row">
          <Button onClick={load} disabled={loading}>Refresh</Button>
          {isHost && <Button variant="secondary" onClick={() => setRoute("waitingRoom")}>Waiting Room</Button>}
          <Button variant="secondary" onClick={() => setRoute("liveMeeting")}>Live Meeting UI</Button>
        </div>
      </Card>

      {isHost && (
        <Card>
          <h2>{editing ? "Edit Meeting" : "Create Meeting"}</h2>
          <div className="form-grid meeting-form-grid">
            <label>
              Meeting type
              <select
                value={form.meetingType}
                onChange={(event) => {
                  const type = event.target.value;
                  const label = meetingTypes.find((item) => item.value === type)?.label || "Custom Meeting";
                  setForm({ ...form, meetingType: type, title: label, customTitle: type === "custom" ? form.customTitle : "" });
                }}
              >
                {meetingTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            {form.meetingType === "custom" ? (
              <label>
                Custom meeting name
                <input value={form.customTitle} onChange={(event) => setForm({ ...form, customTitle: event.target.value })} placeholder="Write custom meeting name" />
              </label>
            ) : (
              <label>
                Meeting title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Meeting title" />
              </label>
            )}

            <label>
              Start date/time
              <input
                type="datetime-local"
                value={form.start}
                onChange={(event) => setForm({ ...form, start: event.target.value, end: form.end || defaultEnd(event.target.value) })}
              />
            </label>

            <label>
              End date/time
              <input type="datetime-local" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
            </label>

            <label>
              Recurrence
              <select value={form.recurrenceFrequency} onChange={(event) => setForm({ ...form, recurrenceFrequency: event.target.value })}>
                {recurrenceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label className="form-span-2">
              Notes
              <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional host notes" />
            </label>
          </div>

          <div className="meeting-preview">
            <strong>Preview:</strong> {visibleTitle} · {recurrenceOptions.find((item) => item.value === form.recurrenceFrequency)?.label}
            {form.recurrenceFrequency !== "once" ? " · shown as one recurring series card" : ""}
          </div>

          <div className="button-row">
            <Button onClick={createMeeting} disabled={loading}>{editing ? "Save Changes" : "Create Meeting"}</Button>
            {editing && <Button variant="ghost" onClick={resetForm}>Cancel Edit</Button>}
          </div>
        </Card>
      )}

      <div className="meeting-list">
        {groups.map((group) => {
          const meeting = group.primary;
          const expanded = Boolean(expandedSeries[group.key]);

          return (
            <Card key={group.key} className="meeting-card">
              <div className="section-row">
                <div>
                  <h2>{meeting.title}</h2>
                  <p>
                    {meeting.meeting_type?.replaceAll("_", " ")} · {pretty(meeting.scheduled_start)} · Status: {meeting.status}
                  </p>
                  <p>
                    {group.isSeries ? `Series: ${meeting.recurrence_label || meeting.recurrence_frequency}` : "One-time meeting"} ·
                    Records: {group.items.length} ·
                    Lecture: {meeting.lecture_mode ? "On" : "Off"} ·
                    Low bandwidth: {meeting.low_bandwidth_mode ? "On" : "Off"} ·
                    Recording: {meeting.recording_enabled ? "On" : "Off"}
                  </p>
                  {meeting.notes && <p className="small-note">Notes: {meeting.notes}</p>}
                </div>
                <span className={`status-badge status-${meeting.status}`}>{group.isSeries ? "SERIES" : meeting.status.toUpperCase()}</span>
              </div>

              <div className="button-row">
                <Button onClick={() => setRoute("waitingRoom")}>{isHost ? "Waiting Room" : "Request to Join"}</Button>
                {isHost && <Button variant="secondary" onClick={() => setRoute("liveMeeting")}>Live UI</Button>}
                {group.items.length > 1 && <Button variant="ghost" onClick={() => toggleSeries(group.key)}>{expanded ? "Hide occurrences" : "Show occurrences"}</Button>}
                {isHost && (
                  <>
                    <Button variant="secondary" onClick={() => startEdit(meeting)}>Edit</Button>
                    <Button variant="secondary" onClick={() => setState(meeting, { status: "opening" })}>Open</Button>
                    <Button variant="secondary" onClick={() => setState(meeting, { status: "live" })}>Go Live</Button>
                    <Button variant="secondary" onClick={() => setState(meeting, { lecture_mode: !meeting.lecture_mode })}>Lecture</Button>
                    <Button variant="secondary" onClick={() => setState(meeting, { low_bandwidth_mode: !meeting.low_bandwidth_mode })}>Low BW</Button>
                    <Button variant="secondary" onClick={() => setState(meeting, { recording_enabled: !meeting.recording_enabled })}>Record</Button>
                    <Button variant="danger" onClick={() => deleteMeeting(meeting)}>Delete</Button>
                    {group.isSeries && <Button variant="danger" onClick={() => deleteMeeting(meeting, "series")}>Delete Series</Button>}
                  </>
                )}
              </div>

              {expanded && (
                <div className="occurrence-list">
                  {group.items.map((item) => (
                    <div key={item.id} className="occurrence-row">
                      <span>{pretty(item.scheduled_start)}</span>
                      <strong>{item.status}</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
