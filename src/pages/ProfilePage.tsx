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
  const { profile, setRoute, logout } = useAppState();
  const [modal, setModal] = useState<"edit" | "switch" | "problem" | "about" | null>(null);
  const isHost = profile ? hostSettingsRoles.includes(profile.role) : false;
  const isOwner = profile?.role === "owner";

  return (
    <div className="profile-mobile-page">
      <section className="profile-header-card">
        <div className="profile-title-row">
          <h1>Profile</h1>
          <button onClick={() => setModal("edit")}>Edit</button>
        </div>
        <div className="profile-identity">
          <img src="/omideno7-logo.png" alt="OmideNo7" onError={(event) => { event.currentTarget.style.display = "none"; }} />
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
            <span>OmideNo7 Meeting ID</span><strong>omideno7-main-room</strong>
            <span>Status</span><strong>Internal app room</strong>
            <span>Security</span><strong>Approved users only</strong>
            <span>Host</span><strong>Apostle Yuhana</strong>
          </div>
          <div className="backup-info">
            <strong>Backup FreeConferenceCall access</strong>
            <p>Link: fccdl.in/i/omideno7church</p>
            <p>Access code: 2452236# · Security code: 789987</p>
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
        <ProfileRow icon="?" label="Report a problem" onClick={() => setModal("problem")} />
        <ProfileRow icon="i" label="About" onClick={() => setModal("about")} />
      </section>

      <Card>
        <Button variant="danger" onClick={logout}>Log out</Button>
        <p className="version-label">Version 0.50.0</p>
      </Card>

      {modal === "edit" && (
        <Modal title="Edit profile" onClose={() => setModal(null)}>
          <p>Profile editing will be connected to Supabase profile fields in the next backend step.</p>
          <p><strong>Current name:</strong> {profile?.displayName}</p>
          <p><strong>Email:</strong> {profile?.email}</p>
          <Button onClick={() => setModal(null)}>Close</Button>
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
          <p>Version 0.50.0 — UI navigation and profile fix.</p>
          <Button onClick={() => setModal(null)}>Close</Button>
        </Modal>
      )}
    </div>
  );
}
