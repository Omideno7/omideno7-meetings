import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { roles } from "../config/roles";

type WaitingPerson = {
  id: string;
  name: string;
  status: "waiting" | "admitted" | "rejected" | "blocked";
  reason: string;
  risk: "normal" | "review" | "high";
  joinedAt: string;
};

const initialWaiting: WaitingPerson[] = [
  {
    id: "w1",
    name: "New approved member",
    status: "waiting",
    reason: "Waiting to join Sunday Service",
    risk: "normal",
    joinedAt: new Date().toLocaleTimeString()
  }
];

export function WaitingRoomPage() {
  const { profile, setRoute } = useAppState();
  const [people, setPeople] = useState<WaitingPerson[]>(initialWaiting);
  const [message, setMessage] = useState("Waiting room ready.");
  const isHost = profile?.role !== roles.APPROVED_MEMBER;

  const waitingCount = useMemo(() => people.filter((item) => item.status === "waiting").length, [people]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPeople((current) => {
        if (current.some((item) => item.id === "w-auto")) return current;
        return [
          ...current,
          {
            id: "w-auto",
            name: "Member waiting",
            status: "waiting",
            reason: "Entered waiting room",
            risk: "review",
            joinedAt: new Date().toLocaleTimeString()
          }
        ];
      });
      setMessage("New person entered the waiting room.");
    }, 12000);

    return () => window.clearInterval(timer);
  }, []);

  function updatePerson(id: string, status: WaitingPerson["status"], text: string) {
    setPeople((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setMessage(text);
  }

  return (
    <div className="page-grid">
      <Card>
        <div className="waiting-header">
          <div>
            <h1>Waiting Room</h1>
            <p>Everyone enters here first. Host or Door Servant decides who can enter the meeting.</p>
          </div>
          <div className={`waiting-badge ${waitingCount ? "active" : ""}`}>
            {waitingCount}
            <span>waiting</span>
          </div>
        </div>
        <p className="auth-message">{message}</p>
        <div className="button-row">
          <Button onClick={() => setRoute("liveMeeting")}>Open Live Meeting</Button>
          <Button variant="secondary" onClick={() => setMessage(`Checked at ${new Date().toLocaleTimeString()}`)}>Check Now</Button>
        </div>
      </Card>

      <div className="waiting-list">
        {people.map((person) => (
          <Card key={person.id}>
            <div className="waiting-person-row">
              <div>
                <h2>{person.name}</h2>
                <p>{person.reason}</p>
                <p>Joined: {person.joinedAt} · Status: {person.status} · Risk: {person.risk}</p>
              </div>
              <span className={`waiting-status waiting-${person.status}`}>{person.status}</span>
            </div>

            {isHost ? (
              <div className="button-row">
                <Button onClick={() => updatePerson(person.id, "admitted", `${person.name} admitted to the meeting.`)}>Admit</Button>
                <Button variant="secondary" onClick={() => setMessage(`Direct message opened for ${person.name}.`)}>Message</Button>
                <Button variant="ghost" onClick={() => updatePerson(person.id, "rejected", `${person.name} rejected from waiting room.`)}>Reject</Button>
                <Button variant="danger" onClick={() => updatePerson(person.id, "blocked", `${person.name} blocked from this account.`)}>Block</Button>
              </div>
            ) : (
              <p>Wait until a host admits you.</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
