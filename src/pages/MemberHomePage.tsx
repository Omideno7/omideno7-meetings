import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { mockMeetings } from "../data/mockMeetings";
import { roles } from "../config/roles";
import type { AppRouteKey } from "../types/routes";

const hostRoles = [roles.OWNER, roles.SENIOR_HOST, roles.MEETING_HOST, roles.CO_HOST];

function ActionCard({
  title,
  desc,
  icon,
  onClick,
  danger
}: {
  title: string;
  desc: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button className={`home-action-card ${danger ? "danger" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <strong>{title}</strong>
      <small>{desc}</small>
    </button>
  );
}

export function MemberHomePage() {
  const { profile, setRoute } = useAppState();
  const canHost = profile ? hostRoles.includes(profile.role) : false;
  const displayName = profile?.displayName || "Approved Member";

  const ownerActions: { title: string; desc: string; icon: string; route: AppRouteKey }[] = [
    { title: "Approvals", desc: "Approve new members", icon: "✓", route: "approvals" },
    { title: "Permissions", desc: "Roles and templates", icon: "☷", route: "permissionTemplates" },
    { title: "Security", desc: "Owner-only controls", icon: "🔒", route: "securityCenter" },
    { title: "Audit Logs", desc: "Review actions", icon: "☰", route: "auditLogs" }
  ];

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
          {canHost ? "Host, schedule, join, or manage church meetings from one place." : "Join approved church meetings through the waiting room."}
        </p>

        <div className={canHost ? "quick-actions three" : "quick-actions one"}>
          {canHost && (
            <>
              <button className="quick-action" onClick={() => setRoute("liveMeeting")}>
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

      <section className="home-action-grid">
        <ActionCard title="Live Meeting" desc="Open meeting room UI" icon="▣" onClick={() => setRoute("liveMeeting")} />
        <ActionCard title="Test Meeting" desc="Practice with servants" icon="🧪" onClick={() => setRoute("liveMeeting")} />
        <ActionCard title="Waiting Room" desc="Enter or manage waiting room" icon="⏳" onClick={() => setRoute("waitingRoom")} />
        <ActionCard title="Video / Audio Test" desc="Camera and microphone check" icon="🎙" onClick={() => setRoute("deviceTest")} />
        <ActionCard title="Recordings" desc="Media library and archives" icon="◉" onClick={() => setRoute("mediaLibrary")} />
        {canHost && <ActionCard title="Host Panel" desc="Servant controls preview" icon="◎" onClick={() => setRoute("servantDashboard")} />}
        {canHost && <ActionCard title="Reports" desc="Attendance and logs" icon="📊" onClick={() => setRoute("reports")} />}
      </section>

      {profile?.role === roles.OWNER && (
        <>
          <section className="section-heading-row">
            <h2>Owner shortcuts</h2>
            <button onClick={() => setRoute("ownerDashboard")}>Owner dashboard</button>
          </section>
          <section className="home-action-grid owner-shortcuts">
            {ownerActions.map((item) => (
              <ActionCard key={item.route} title={item.title} desc={item.desc} icon={item.icon} onClick={() => setRoute(item.route)} />
            ))}
          </section>
        </>
      )}

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
    </div>
  );
}
