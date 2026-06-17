import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { dataMode } from "../config/dataMode";
import { supabaseAdminService, type MeetingRow } from "../services/supabaseAdminService";
import { useAppState } from "../app/AppState";

function pretty(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString();
}

export function MeetingSchedulePage() {
  const { setRoute, profile } = useAppState();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "Sunday Church Service", meetingType: "service", start: "", end: "" });
  const isHost = profile?.role !== "approved_member";

  async function load() {
    setLoading(true);
    const result = await supabaseAdminService.listMeetings();
    setMeetings(result.data);
    setMessage(result.error || "");
    setLoading(false);
  }

  async function createMeeting() {
    setLoading(true);
    const result = await supabaseAdminService.createMeeting({
      title: form.title,
      meetingType: form.meetingType,
      start: form.start,
      end: form.end
    });
    setMessage(result.error || "Meeting created.");
    await load();
    setLoading(false);
  }

  async function setState(meeting: MeetingRow, patch: Partial<MeetingRow>) {
    setLoading(true);
    const result = await supabaseAdminService.updateMeetingState({
      id: meeting.id,
      status: patch.status,
      lectureMode: patch.lecture_mode,
      lowBandwidthMode: patch.low_bandwidth_mode,
      recordingEnabled: patch.recording_enabled
    });
    setMessage(result.error || "Meeting updated.");
    await load();
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page-grid">
      <Card>
        <h1>Meeting Schedule</h1>
        <p>All meetings remain under the church account. Trusted servants can operate only the controls Owner allows.</p>
        <p className="small-note">Data mode: {dataMode}</p>
        <div className="button-row">
          <Button onClick={load} disabled={loading}>Refresh Meetings</Button>
          <Button variant="secondary" onClick={() => setRoute("waitingRoom")}>Open Waiting Room</Button>
        </div>
        {message && <p className="auth-message">{message}</p>}
      </Card>

      {isHost && (
        <Card>
          <h2>Create Meeting</h2>
          <div className="form-grid">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Meeting title" />
            <select value={form.meetingType} onChange={(event) => setForm({ ...form, meetingType: event.target.value })}>
              <option value="service">Sunday Service</option>
              <option value="morning_prayer">Morning Prayer</option>
              <option value="bible_class">Bible Class</option>
              <option value="leadership">Leadership Meeting</option>
            </select>
            <input type="datetime-local" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
            <input type="datetime-local" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
          </div>
          <Button onClick={createMeeting} disabled={loading}>Create Meeting</Button>
        </Card>
      )}

      {meetings.map((meeting) => (
        <Card key={meeting.id} className="meeting-card">
          <div className="section-row">
            <div>
              <h2>{meeting.title}</h2>
              <p>{meeting.meeting_type} · {pretty(meeting.scheduled_start)} · Status: {meeting.status}</p>
              <p>Lecture: {meeting.lecture_mode ? "On" : "Off"} · Low bandwidth: {meeting.low_bandwidth_mode ? "On" : "Off"} · Recording: {meeting.recording_enabled ? "On" : "Off"}</p>
            </div>
            <span className={`status-badge status-${meeting.status}`}>{meeting.status.toUpperCase()}</span>
          </div>

          <div className="button-row">
            <Button onClick={() => setRoute("waitingRoom")}>Join Waiting Room</Button>
            {isHost && (
              <>
                <Button variant="secondary" onClick={() => setState(meeting, { status: "opening" })}>Open Room</Button>
                <Button variant="secondary" onClick={() => setState(meeting, { status: "live" })}>Go Live</Button>
                <Button variant="secondary" onClick={() => setState(meeting, { lecture_mode: !meeting.lecture_mode })}>Lecture Mode</Button>
                <Button variant="secondary" onClick={() => setState(meeting, { low_bandwidth_mode: !meeting.low_bandwidth_mode })}>Low Bandwidth</Button>
                <Button variant="secondary" onClick={() => setState(meeting, { recording_enabled: !meeting.recording_enabled })}>Recording</Button>
                <Button variant="danger" onClick={() => setState(meeting, { status: "ended" })}>End</Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
