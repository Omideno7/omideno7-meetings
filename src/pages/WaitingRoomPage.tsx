import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { demoStore } from "../services/demoStore";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";

export function WaitingRoomPage() {
  const { setRoute, profile } = useAppState();
  useDemoStoreVersion();
  const entries = demoStore.listWaitingRoom();
  const isHost = profile?.role !== "approved_member";

  return (
    <div className="page-grid">
      <Card>
        <h1>Waiting Room</h1>
        <p>Everyone enters here first. A host or authorized servant must admit the participant before LiveKit token is requested.</p>
        <ul><li>Microphone: Off by default</li><li>Camera: Off by default</li><li>Audio output: Speaker by default</li></ul>
        <div className="button-row"><Button onClick={() => setRoute("liveMeeting")}>Demo: Admit and Join</Button><Button variant="secondary" onClick={() => demoStore.resetWaitingDemo()}>Reset Waiting Demo</Button></div>
      </Card>
      {entries.map((entry) => (
        <Card key={entry.id} className={`status-card status-${entry.status}`}>
          <div className="section-row"><div><h2>{entry.name}</h2><p>{entry.role} · {entry.device} · requested at {entry.requestedAt}</p></div><span className={`status-pill ${entry.status}`}>{entry.status}</span></div>
          {isHost && <div className="button-row"><Button onClick={() => demoStore.updateWaiting(entry.id, "admitted")}>Admit</Button><Button variant="danger" onClick={() => demoStore.updateWaiting(entry.id, "rejected")}>Reject</Button></div>}
        </Card>
      ))}
    </div>
  );
}
