import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { mockMeetings } from "../data/mockMeetings";

export function MemberHomePage() {
  const { setRoute } = useAppState();

  return (
    <div className="page-grid">
      <Card>
        <h1>Member Home</h1>
        <p>Approved members can join approved meetings, enter Waiting Room, use chat/request features, and see published recordings.</p>
      </Card>
      {mockMeetings.map((meeting) => (
        <Card key={meeting.id}>
          <h2>{meeting.title}</h2>
          <p>{meeting.startsAt}</p>
          <Button onClick={() => setRoute("waitingRoom")}>Enter Waiting Room</Button>
        </Card>
      ))}
    </div>
  );
}
