import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { canManageWaitingRoom, isHostLike } from "../services/roleAccess";

type WaitingPerson = {
  id: string;
  name: string;
  note: string;
  status: "waiting" | "admitted" | "rejected";
};

const initialWaiting: WaitingPerson[] = [
  { id: "wait-1", name: "Member waiting", note: "Entered waiting room now", status: "waiting" }
];

export function WaitingRoomPage() {
  const { profile, setRoute } = useAppState();
  const [waiting, setWaiting] = useState<WaitingPerson[]>(initialWaiting);
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("Ready");
  const canManage = canManageWaitingRoom(profile);
  const canHost = isHostLike(profile);

  function admit(person: WaitingPerson) {
    setWaiting((current) => current.map((item) => item.id === person.id ? { ...item, status: "admitted" } : item));
    setMessage(`${person.name} admitted.`);
  }

  function reject(person: WaitingPerson) {
    setWaiting((current) => current.map((item) => item.id === person.id ? { ...item, status: "rejected" } : item));
    setMessage(`${person.name} rejected.`);
  }

  function removeDone() {
    setWaiting((current) => current.filter((item) => item.status === "waiting"));
  }

  if (!canManage) {
    return (
      <div className="page-grid">
        <Card>
          <h1>Waiting Room</h1>
          <p>Approved members enter the waiting room first. A host or Door Servant must admit you before you enter the main meeting.</p>
          <div className="member-waiting-status">
            <strong>{joined ? "You are waiting for host approval." : "You have not entered the waiting room yet."}</strong>
            <span>Mic off · Camera off · Waiting for host</span>
          </div>
          <div className="button-row">
            {!joined ? (
              <Button onClick={() => { setJoined(true); setMessage("You entered the waiting room."); }}>Enter Waiting Room</Button>
            ) : (
              <Button variant="secondary" onClick={() => setRoute("liveMeeting")}>Open Meeting Preview</Button>
            )}
            <Button variant="ghost" onClick={() => setRoute("memberHome")}>Back Home</Button>
          </div>
          <p className="auth-message">{message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <Card>
        <h1>Waiting Room Control</h1>
        <p>Only Owner, Host, Co-host, or Door Servant can admit/reject people from the waiting room.</p>
        <p className="small-note">Signed in as: {profile?.displayName} · {profile?.role?.replaceAll("_", " ")}</p>
        <div className="button-row">
          {canHost && <Button onClick={() => setRoute("liveMeeting")}>Open Live Meeting</Button>}
          <Button variant="secondary" onClick={removeDone}>Clear admitted/rejected</Button>
        </div>
        <p className="auth-message">{message}</p>
      </Card>

      <div className="meeting-list">
        {waiting.map((person) => (
          <Card key={person.id} className={`waiting-live-card visible-waiting-card status-${person.status}`}>
            <div className="section-row">
              <div>
                <h2>{person.name}</h2>
                <p>{person.note}</p>
                <p className="small-note">ID: {person.id} · Status: {person.status}</p>
              </div>
              <span className={`status-badge status-${person.status}`}>{person.status.toUpperCase()}</span>
            </div>
            {person.status === "waiting" && (
              <div className="button-row">
                <Button onClick={() => admit(person)}>Admit</Button>
                <Button variant="secondary" onClick={() => setMessage(`Message opened for ${person.name}.`)}>Message</Button>
                <Button variant="danger" onClick={() => reject(person)}>Reject</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
