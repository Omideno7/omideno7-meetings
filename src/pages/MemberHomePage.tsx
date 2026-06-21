import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { mockMeetings } from "../data/mockMeetings";
import { roles } from "../config/roles";

const hostRoles = [roles.OWNER, roles.SENIOR_HOST, roles.MEETING_HOST, roles.CO_HOST];

export function MemberHomePage() {
  const { profile, setRoute } = useAppState();
  const canHost = profile ? hostRoles.includes(profile.role) : false;
  const displayName = profile?.displayName || "Approved Member";

  return (
    <div className="mobile-page">
      <section className="meeting-hero-card">
        <div className="home-brand-block">
          <img src="/omideno7-logo.png" alt="OmideNo7" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <div>
            <h1>OmideNo7 Meetings</h1>
            <p>Secure Church Meetings</p>
          </div>
        </div>

        <p className="hero-subtitle">
          {canHost ? "Host, schedule or join an approved church meeting" : "Join approved church meetings through the waiting room"}
        </p>

        <div className={canHost ? "quick-actions three" : "quick-actions one"}>
          {canHost && (
            <>
              <button className="quick-action" onClick={() => setRoute("meetingSchedule")}>
                <span>🎥</span>
                <strong>Host</strong>
              </button>
              <button className="quick-action" onClick={() => setRoute("meetingSchedule")}>
                <span>📅</span>
                <strong>Schedule</strong>
              </button>
            </>
          )}
          <button className="quick-action" onClick={() => setRoute("waitingRoom")}>
            <span>⬆</span>
            <strong>Join</strong>
          </button>
        </div>
      </section>

      <section className="role-summary-card">
        <div>
          <span>Signed in as</span>
          <strong>{displayName}</strong>
          <small>{profile?.role?.replaceAll("_", " ")} · {profile?.status}</small>
        </div>
        <Button variant="secondary" onClick={() => setRoute("profile")}>Profile</Button>
      </section>

      <section className="section-heading-row">
        <h2>Upcoming meetings</h2>
        <button onClick={() => setRoute("meetingSchedule")}>See all</button>
      </section>

      <div className="recent-meetings-list">
        {mockMeetings.map((meeting) => (
          <article className="recent-meeting-item" key={meeting.id}>
            <div className="meeting-avatar">
              <img src="/omideno7-logo.png" alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            </div>
            <div>
              <strong>{meeting.title}</strong>
              <span>{meeting.startsAt}</span>
            </div>
            <Button variant="secondary" onClick={() => setRoute("waitingRoom")}>Join</Button>
          </article>
        ))}
      </div>

      <section className="dashboard-grid">
        <Card>
          <h2>Video / Audio Test</h2>
          <p>Test camera and microphone before joining.</p>
          <Button variant="secondary" onClick={() => setRoute("deviceTest")}>Open Test</Button>
        </Card>
        <Card>
          <h2>Recordings</h2>
          <p>Published church meeting archives.</p>
          <Button variant="secondary" onClick={() => setRoute("mediaLibrary")}>Open</Button>
        </Card>
      </section>
    </div>
  );
}
