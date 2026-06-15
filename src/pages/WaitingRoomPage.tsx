import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";

export function WaitingRoomPage() {
  const { setRoute } = useAppState();

  return (
    <Card>
      <h1>Waiting Room</h1>
      <p>Everyone enters here first. A host or authorized servant must admit the participant before LiveKit token is requested.</p>
      <ul>
        <li>Microphone: Off by default</li>
        <li>Camera: Off by default</li>
        <li>Audio output: Speaker by default</li>
      </ul>
      <Button onClick={() => setRoute("liveMeeting")}>Demo: Admit and Join</Button>
    </Card>
  );
}
