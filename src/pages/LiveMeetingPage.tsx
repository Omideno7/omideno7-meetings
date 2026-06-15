import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function LiveMeetingPage() {
  return (
    <Card>
      <h1>Live Meeting</h1>
      <p>This is the React placeholder for the real LiveKit room.</p>
      <div className="meeting-stage">
        <strong>Speaker Area</strong>
        <span>Audio-only / Video / Screen share ready</span>
      </div>
      <div className="button-row">
        <Button variant="secondary">Mic Off</Button>
        <Button variant="secondary">Camera Off</Button>
        <Button variant="secondary">Speaker / Earpiece</Button>
        <Button variant="secondary">Low Bandwidth</Button>
      </div>
    </Card>
  );
}
