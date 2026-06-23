import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { canManageWaitingRoom, isHostLike } from "../services/roleAccess";
import { meetingRoomService, type RoomParticipant } from "../services/meetingRoomService";

export function WaitingRoomPage() {
  const { profile, setRoute } = useAppState();
  const [waiting, setWaiting] = useState<RoomParticipant[]>([]);
  const [message, setMessage] = useState("Ready");
  const canManage = canManageWaitingRoom(profile);
  const canHost = isHostLike(profile);

  async function load() {
    const rows = await meetingRoomService.listParticipants("waiting");
    setWaiting(rows);
  }

  useEffect(() => {
    void load();
    const unsubscribe = meetingRoomService.subscribe(load);
    const timer = window.setInterval(load, 2500);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);

  async function enterWaitingRoom() {
    await meetingRoomService.joinWaiting(profile);
    await meetingRoomService.raiseAlert(`${profile?.displayName || "A member"} is waiting for admission.`, "waiting_room", "red", "active");
    setMessage("Waiting request sent. Opening live page...");
    window.setTimeout(() => setRoute("liveMeeting"), 300);
  }

  async function admit(person: RoomParticipant) {
    await meetingRoomService.admitParticipant(person.id);
    setMessage(`${person.display_name} admitted.`);
    await load();
  }

  async function reject(person: RoomParticipant) {
    await meetingRoomService.rejectParticipant(person.id);
    setMessage(`${person.display_name} rejected.`);
    await load();
  }

  if (!canManage) {
    return (
      <div className="page-grid">
        <Card>
          <h1>Waiting Room</h1>
          <p>Send your waiting request. After host admission, the Live page will open the active room.</p>
          <div className="member-waiting-status">
            <strong>Mic off · Camera off</strong>
            <span>Waiting for host admission</span>
          </div>
          <div className="button-row">
            <Button onClick={enterWaitingRoom}>Enter Waiting Room</Button>
            <Button variant="secondary" onClick={() => setRoute("liveMeeting")}>Open Live Page</Button>
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
        <p>Admit or reject approved members before they enter the main meeting.</p>
        <p className="small-note">Signed in as: {profile?.displayName} · {profile?.role?.replaceAll("_", " ")}</p>
        <div className="button-row">
          {canHost && <Button onClick={() => setRoute("liveMeeting")}>Open Live Meeting</Button>}
          <Button variant="secondary" onClick={load}>Refresh</Button>
          <Button variant="ghost" onClick={() => setRoute("memberHome")}>Back Home</Button>
        </div>
        <p className="auth-message">{message}</p>
      </Card>

      <div className="meeting-list">
        {waiting.length === 0 ? (
          <Card><p>No one is waiting now.</p></Card>
        ) : waiting.map((person) => (
          <Card key={person.id} className="waiting-live-card visible-waiting-card status-waiting">
            <div className="section-row">
              <div>
                <h2>{person.display_name}</h2>
                <p>{person.role_label}</p>
                <p className="small-note">ID: {person.id}</p>
              </div>
              <span className="status-badge status-waiting">WAITING</span>
            </div>
            <div className="button-row">
              <Button onClick={() => admit(person)}>Admit</Button>
              <Button variant="danger" onClick={() => reject(person)}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
