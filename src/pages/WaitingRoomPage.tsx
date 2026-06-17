import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { dataMode } from "../config/dataMode";
import { demoStore } from "../services/demoStore";
import { supabaseAdminService, type MeetingRow, type WaitingEntry } from "../services/supabaseAdminService";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";

export function WaitingRoomPage() {
  const { setRoute, profile } = useAppState();
  useDemoStoreVersion();

  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [entries, setEntries] = useState<WaitingEntry[]>([]);
  const [message, setMessage] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("iPhone / Mobile");
  const [loading, setLoading] = useState(false);
  const isHost = profile?.role !== "approved_member";
  const activeMeeting = meetings.find((item) => item.status === "live" || item.status === "opening") || meetings[0];

  async function load() {
    if (dataMode !== "supabase") return;
    setLoading(true);
    const meetingResult = await supabaseAdminService.listMeetings();
    const waitingResult = await supabaseAdminService.listWaitingEntries();
    setMeetings(meetingResult.data);
    setEntries(waitingResult.data);
    setMessage(meetingResult.error || waitingResult.error || "");
    setLoading(false);
  }

  async function join() {
    if (!activeMeeting || !profile) {
      setMessage("No meeting is available yet. Owner or host must create/open a meeting first.");
      return;
    }
    setLoading(true);
    const result = await supabaseAdminService.joinWaitingRoom(activeMeeting.id, profile.displayName || profile.fullName, deviceLabel);
    setMessage(result.error || "You entered the waiting room. A host must admit you.");
    await load();
    setLoading(false);
  }

  async function decide(id: string, status: "admitted" | "rejected" | "removed") {
    setLoading(true);
    const result = await supabaseAdminService.decideWaitingEntry(id, status);
    setMessage(result.error || `Entry marked ${status}.`);
    await load();
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  if (dataMode !== "supabase") {
    const localEntries = demoStore.listWaitingRoom();
    return (
      <div className="page-grid">
        <Card>
          <h1>Waiting Room</h1>
          <p>Local demo mode. Supabase waiting room activates in production mode.</p>
          <div className="button-row">
            <Button onClick={() => setRoute("liveMeeting")}>Demo: Admit and Join</Button>
            <Button variant="secondary" onClick={() => demoStore.resetWaitingDemo()}>Reset Waiting Demo</Button>
          </div>
        </Card>
        {localEntries.map((entry) => (
          <Card key={entry.id} className={`status-card status-${entry.status}`}>
            <div className="section-row">
              <div><h2>{entry.name}</h2><p>{entry.role} · {entry.device} · requested at {entry.requestedAt}</p></div>
              <span className={`status-pill ${entry.status}`}>{entry.status}</span>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="page-grid">
      <Card>
        <h1>Waiting Room</h1>
        <p>Every participant enters here first. Mic and camera stay off by default until the user chooses otherwise and host permissions allow it.</p>
        <p className="small-note">Current meeting: {activeMeeting ? activeMeeting.title : "No meeting created yet"} · Data mode: {dataMode}</p>
        <div className="form-grid">
          <select value={deviceLabel} onChange={(event) => setDeviceLabel(event.target.value)}>
            <option>iPhone / Mobile</option>
            <option>iPad / Tablet</option>
            <option>Laptop</option>
            <option>Low Bandwidth Audio Only</option>
          </select>
        </div>
        <div className="button-row">
          <Button onClick={join} disabled={loading}>Enter Waiting Room</Button>
          <Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="ghost" onClick={() => setRoute("meetingSchedule")}>Meetings</Button>
        </div>
        {message && <p className="auth-message">{message}</p>}
      </Card>

      {entries.map((entry) => (
        <Card key={entry.id} className={`status-card status-${entry.status}`}>
          <div className="section-row">
            <div>
              <h2>{entry.display_name}</h2>
              <p>{entry.device_label || "Unknown device"} · {entry.status} · {entry.created_at ? new Date(entry.created_at).toLocaleString() : ""}</p>
            </div>
            <span className={`status-pill ${entry.status}`}>{entry.status}</span>
          </div>
          {isHost && entry.status === "waiting" && (
            <div className="button-row">
              <Button onClick={() => decide(entry.id, "admitted")}>Admit</Button>
              <Button variant="danger" onClick={() => decide(entry.id, "rejected")}>Reject</Button>
              <Button variant="ghost" onClick={() => decide(entry.id, "removed")}>Remove</Button>
            </div>
          )}
          {entry.status === "admitted" && (
            <div className="button-row">
              <Button onClick={() => setRoute("liveMeeting")}>Join Live Meeting</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
