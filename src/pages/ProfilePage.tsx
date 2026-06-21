import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAppState } from "../app/AppState";
import { roles } from "../config/roles";

const hostSettingsRoles = [
  roles.OWNER,
  roles.SENIOR_HOST,
  roles.MEETING_HOST,
  roles.CO_HOST,
  roles.MEDIA_SERVANT,
  roles.DOOR_SERVANT
];

function ProfileRow({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button className="profile-row" onClick={onClick}>
      <span>{icon}</span>
      <strong>{label}</strong>
      <em>›</em>
    </button>
  );
}

export function ProfilePage() {
  const { profile, setRoute, logout } = useAppState();
  const isHost = profile ? hostSettingsRoles.includes(profile.role) : false;
  const isOwner = profile?.role === "owner";

  return (
    <div className="profile-mobile-page">
      <section className="profile-header-card">
        <div className="profile-title-row">
          <h1>Profile</h1>
          <button>Edit</button>
        </div>
        <div className="profile-identity">
          <img src="/omideno7-logo.png" alt="OmideNo7" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <div>
            <strong>{profile?.displayName || "OmideNo7 Member"}</strong>
            <span>{profile?.email}</span>
            <button>Switch account</button>
          </div>
        </div>
      </section>

      {isHost && (
        <section className="profile-info-block">
          <h2>My meeting info</h2>
          <div className="info-grid">
            <span>Meeting ID</span><strong>omideno7church</strong>
            <span>Phone number</span><strong>🇭🇷 01 7757 417</strong>
            <span>Access code</span><strong>2452236#</strong>
            <span>Security code</span><strong>789987</strong>
          </div>
          <button className="share-invite">⇧ Share invite</button>
        </section>
      )}

      <section className="profile-list-section">
        <h2>Profile</h2>
        <ProfileRow icon="◉" label="Recordings" onClick={() => setRoute("mediaLibrary")} />
        {isHost && <ProfileRow icon="▣" label="Go to meeting wall" onClick={() => setRoute("meetingSchedule")} />}
      </section>

      {isHost && (
        <section className="profile-list-section">
          <h2>Settings</h2>
          <ProfileRow icon="▭" label="Meeting" onClick={() => setRoute("meetingSchedule")} />
          <ProfileRow icon="🔒" label="Security" onClick={() => isOwner ? setRoute("securityCenter") : setRoute("servantDashboard")} />
          <ProfileRow icon="⚙" label="Additional settings" onClick={() => setRoute("deviceTest")} />
        </section>
      )}

      {isOwner && (
        <section className="profile-list-section">
          <h2>Owner</h2>
          <ProfileRow icon="✓" label="Approvals" onClick={() => setRoute("approvals")} />
          <ProfileRow icon="☷" label="Permission Templates" onClick={() => setRoute("permissionTemplates")} />
          <ProfileRow icon="☰" label="Audit Logs" onClick={() => setRoute("auditLogs")} />
        </section>
      )}

      <section className="profile-list-section">
        <h2>Support</h2>
        <ProfileRow icon="?" label="Report a problem" />
        <ProfileRow icon="i" label="About" />
      </section>

      <Card>
        <Button variant="danger" onClick={logout}>Log out</Button>
        <p className="version-label">Version 0.45.0</p>
      </Card>
    </div>
  );
}
