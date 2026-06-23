import { useState } from "react";
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

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="simple-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

export function ProfilePage() {
  const { profile, setRoute, logout, updateProfile } = useAppState();
  const [modal, setModal] = useState<"edit" | "switch" | "problem" | "about" | null>(null);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [saved, setSaved] = useState("");
  const isHost = profile ? hostSettingsRoles.includes(profile.role) : false;
  const isOwner = profile?.role === "owner";

  function saveProfile() {
    updateProfile({ displayName: displayName.trim() || profile?.displayName || "OmideNo7 Member", avatarUrl });
    setSaved("Profile updated locally. Supabase profile sync will be connected in the next backend step.");
    window.setTimeout(() => setModal(null), 1200);
  }

  function readAvatar(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  const avatar = profile?.avatarUrl || avatarUrl;

  return (
    <div className="profile-mobile-page">
      <section className="profile-header-card">
        <div className="profile-title-row">
          <h1>Profile</h1>
          <button onClick={() => setModal("edit")}>Edit</button>
        </div>
        <div className="profile-identity">
          {avatar ? <img src={avatar} alt="Profile" /> : <img src="/omideno7-logo.png" alt="OmideNo7" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          <div>
            <strong>{profile?.displayName || "OmideNo7 Member"}</strong>
            <span>{profile?.email}</span>
            <button onClick={() => setModal("switch")}>Switch account</button>
          </div>
        </div>
      </section>

      {isHost && (
        <section className="profile-info-block">
          <h2>My meeting info</h2>
          <div className="info-grid">
            <span>Internal room</span><strong>OmideNo7 Main Room</strong>
            <span>Room type</span><strong>Secure approved-member room</strong>
            <span>Owner</span><strong>Apostle Yuhana</strong>
            <span>Access rule</span><strong>Approved users only + Waiting Room</strong>
            <span>Default join</span><strong>Mic off · Camera off</strong>
            <span>Meeting engine</span><strong>LiveKit/WebRTC backend phase</strong>
          </div>
          <button className="share-invite" onClick={() => setRoute("meetingSchedule")}>Open meeting schedule</button>
        </section>
      )}

      <section className="profile-list-section">
        <h2>Profile</h2>
        <ProfileRow icon="⌂" label="Home" onClick={() => setRoute("memberHome")} />
        <ProfileRow icon="▣" label="Live Meeting" onClick={() => setRoute("liveMeeting")} />
        <ProfileRow icon="🎙" label="Video / Audio Test" onClick={() => setRoute("deviceTest")} />
        <ProfileRow icon="◉" label="Recordings" onClick={() => setRoute("mediaLibrary")} />
      </section>

      {isHost && (
        <section className="profile-list-section">
          <h2>Host settings</h2>
          <ProfileRow icon="📅" label="Meeting schedule" onClick={() => setRoute("meetingSchedule")} />
          <ProfileRow icon="⏳" label="Waiting room" onClick={() => setRoute("waitingRoom")} />
          <ProfileRow icon="◎" label="Host panel" onClick={() => setRoute("servantDashboard")} />
          <ProfileRow icon="▭" label="Reports" onClick={() => setRoute("reports")} />
          <ProfileRow icon="⚙" label="Additional settings" onClick={() => setRoute("deviceTest")} />
        </section>
      )}

      {isOwner && (
        <section className="profile-list-section">
          <h2>Owner</h2>
          <ProfileRow icon="✓" label="Approvals" onClick={() => setRoute("approvals")} />
          <ProfileRow icon="☷" label="Permission Templates" onClick={() => setRoute("permissionTemplates")} />
          <ProfileRow icon="🔒" label="Security Center" onClick={() => setRoute("securityCenter")} />
          <ProfileRow icon="☰" label="Audit Logs" onClick={() => setRoute("auditLogs")} />
        </section>
      )}

      <section className="profile-list-section">
        <h2>Support</h2>
        <ProfileRow icon="?" label="Report a problem" onClick={() => profile?.role === roles.OWNER ? setRoute("testingCenter") : setModal("problem")} />
        <ProfileRow icon="i" label="About" onClick={() => setModal("about")} />
      </section>

      <Card>
        <Button variant="danger" onClick={logout}>Log out</Button>
        <p className="version-label">Version 1.10.0 QA-ready</p>
      </Card>

      {modal === "edit" && (
        <Modal title="Edit profile" onClose={() => setModal(null)}>
          <div className="pref-form">
            <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
            <label>Profile picture from phone gallery / computer
              <input type="file" accept="image/*" onChange={(event) => readAvatar(event.target.files?.[0])} />
              <small>On mobile this opens your gallery/photo picker.</small>
            </label>
            {avatarUrl && <img className="avatar-preview" src={avatarUrl} alt="Preview" />}
            <Button onClick={saveProfile}>Save profile</Button>
            {saved && <p className="auth-message message-success">{saved}</p>}
          </div>
        </Modal>
      )}

      {modal === "switch" && (
        <Modal title="Switch account" onClose={() => setModal(null)}>
          <p>To switch account, log out and sign in with another approved email.</p>
          <Button variant="danger" onClick={logout}>Log out now</Button>
        </Modal>
      )}

      {modal === "problem" && (
        <Modal title="Report a problem" onClose={() => setModal(null)}>
          <p>Please send the issue to the church app administrator.</p>
          <p><strong>Email:</strong> omideno7church@gmail.com</p>
          <p>Include your device, browser, and what button/page caused the issue.</p>
          <Button onClick={() => setModal(null)}>Close</Button>
        </Modal>
      )}

      {modal === "about" && (
        <Modal title="About OmideNo7 Meetings" onClose={() => setModal(null)}>
          <p><strong>OmideNo7 Meetings</strong></p>
          <p>Secure church meetings app for approved members, hosts, servants, and Owner controls.</p>
          <p>Version 1.10.0 QA-ready — meeting scheduling, live UI cleanup, profile edit and audio test upgrade.</p>
          <Button onClick={() => setModal(null)}>Close</Button>
        </Modal>
      )}
    </div>
  );
}
