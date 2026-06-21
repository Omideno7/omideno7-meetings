import { useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { demoStore } from "../services/demoStore";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";
import { useAppState } from "../app/AppState";
import { roles } from "../config/roles";

const hostPreferenceRoles = [
  roles.OWNER,
  roles.SENIOR_HOST,
  roles.MEETING_HOST,
  roles.CO_HOST,
  roles.MEDIA_SERVANT,
  roles.DOOR_SERVANT
];

const hostControlRoles = [
  roles.OWNER,
  roles.SENIOR_HOST,
  roles.MEETING_HOST,
  roles.CO_HOST
];

const samplePeople = [
  { name: "Mehran", email: "mehran@example.com", avatar: "headphones", active: true, mic: false },
  { name: "narmin", email: "narminmohamadi67@gmail.com", avatar: "image", active: true, mic: true },
  { name: "Apostle Yuhana", email: "omideno7church@gmail.com", avatar: "logo", active: false, mic: false },
  { name: "nikoo", email: "nikomohabat777@gmail.com", avatar: "butterfly", active: false, mic: false },
  { name: "Katrin", email: "katy777@gmail.com", avatar: "jesus", active: false, mic: false }
];

function ParticipantAvatar({ person }: { person: (typeof samplePeople)[number] }) {
  if (person.avatar === "logo") return <img src="/omideno7-logo.png" alt="" />;
  if (person.avatar === "headphones") return <span className="participant-symbol">🎧</span>;
  if (person.avatar === "image") return <span className="participant-symbol">🤝</span>;
  if (person.avatar === "butterfly") return <span className="participant-symbol">🦋</span>;
  return <span className="participant-symbol">✝</span>;
}

function PreferencesModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState("General");
  const tabs = ["General", "Profile", "Audio", "Video", "Meeting settings", "Security", "Advanced", "Updates"];

  return (
    <div className="modal-backdrop">
      <section className="preferences-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <aside>
          <h2>Preferences</h2>
          {tabs.map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </aside>
        <main>
          <h2>{tab}</h2>
          {tab === "General" && (
            <div className="pref-form">
              <label>Name<input value="Apostle Yuhana" readOnly /></label>
              <label>Email<input placeholder="Enter email" /></label>
              <label>Language<select><option>English</option><option>Persian</option></select></label>
              <label className="toggle-line"><input type="checkbox" /> Enable keyboard shortcuts</label>
            </div>
          )}
          {tab === "Profile" && (
            <div className="pref-info">
              <img src="/omideno7-logo.png" alt="OmideNo7" />
              <p><strong>Meeting ID</strong> omideno7church</p>
              <p><strong>Access code</strong> 2452236#</p>
              <p><strong>Security code</strong> 789987</p>
              <Button variant="secondary">Copy invite</Button>
            </div>
          )}
          {tab === "Audio" && (
            <div className="pref-form">
              <label>Recording device<select><option>Same as System</option><option>Built-in Microphone</option></select></label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Automatically adjust level</label>
              <label className="toggle-line"><input type="checkbox" /> Noise reduction</label>
              <label>Input volume<input type="range" defaultValue={45} /></label>
              <label>Output volume<input type="range" defaultValue={82} /></label>
            </div>
          )}
          {tab === "Video" && (
            <div className="pref-form">
              <div className="video-preview-box">Camera preview</div>
              <label>Video settings<select><option>FaceTime HD Camera</option><option>External camera</option></select></label>
            </div>
          )}
          {tab === "Meeting settings" && (
            <div className="pref-form">
              <label className="toggle-line"><input type="checkbox" /> Entry and exit tones</label>
              <label>Announce caller count<select><option>Hosts only</option><option>Everyone</option></select></label>
              <label>Wait for host<select><option>On - 1 minute</option><option>Always</option></select></label>
              <label>Recording<select><option>On</option><option>Off</option></select></label>
            </div>
          )}
          {tab === "Security" && (
            <div className="pref-form">
              <label>Security code<input value="789987" readOnly /></label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Require code for meetings</label>
              <label className="toggle-line"><input type="checkbox" /> Require code for meeting wall</label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Waiting room required</label>
            </div>
          )}
          {tab === "Advanced" && (
            <div className="pref-form">
              <label>Network mode<select><option>Automatic connection</option><option>Low bandwidth</option></select></label>
              <label className="toggle-line"><input type="checkbox" /> Debug logs for support</label>
            </div>
          )}
          {tab === "Updates" && (
            <div className="pref-info">
              <p><strong>OmideNo7 Meetings</strong></p>
              <p>Version 0.45.0</p>
              <p>FCC-inspired UI refactor. Not a copy; branded for OmideNo7.</p>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

export function LiveMeetingPage() {
  const { profile, setRoute } = useAppState();
  useDemoStoreVersion();
  const state = demoStore.getMeetingState();
  const [panel, setPanel] = useState<"attendees" | "rooms" | "chat">("attendees");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const canUsePreferences = profile ? hostPreferenceRoles.includes(profile.role) : false;
  const canUseHostControls = profile ? hostControlRoles.includes(profile.role) : false;

  const people = useMemo(() => {
    const me = profile ? {
      name: profile.displayName,
      email: profile.email,
      avatar: "logo",
      active: false,
      mic: Boolean(state.mic)
    } : samplePeople[2];

    const filtered = samplePeople.filter((item) => item.email !== me.email);
    return [me, ...filtered].slice(0, 6);
  }, [profile, state.mic]);

  function toggle(key: string) {
    demoStore.setMeetingState({ [key]: !state[key] });
  }

  return (
    <div className="live-shell">
      <header className="live-topbar">
        <div>
          <strong>OmideNo7 Sunday Service</strong>
          <span>{state.lowBandwidth ? "Low bandwidth mode" : "Secure church meeting"}</span>
        </div>
        <div className="live-topbar-actions">
          {canUseHostControls && <button className={state.lectureMode ? "danger" : ""} onClick={() => toggle("lectureMode")}>Lecture Mode</button>}
          {canUseHostControls && <button onClick={() => demoStore.setMeetingState({ lowBandwidth: !state.lowBandwidth })}>Low Bandwidth</button>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "Hide Panel" : "Show Panel"}</button>
        </div>
      </header>

      <main className="live-main">
        <section className={sidebarOpen ? "participants-grid with-panel" : "participants-grid"}>
          {people.map((person, index) => (
            <article key={`${person.email}-${index}`} className={`participant-tile ${person.active ? "speaking" : ""}`}>
              <div className="participant-avatar"><ParticipantAvatar person={person as any} /></div>
              <strong>{person.name}</strong>
              <span>{person.email}</span>
              <em className={person.mic ? "mic-on" : "mic-off"}>{person.mic ? "Mic on" : "Muted"}</em>
            </article>
          ))}
        </section>

        {sidebarOpen && (
          <aside className="attendees-panel">
            <div className="attendees-head">
              <strong>{panel === "rooms" ? "Breakout rooms" : panel === "chat" ? "Chat" : "Attendees"} ({people.length + 71})</strong>
              <button onClick={() => setSidebarOpen(false)}>×</button>
            </div>

            {canUseHostControls && (
              <div className="host-mini-controls">
                <button onClick={() => toggle("mic")}>Mute</button>
                <button>Hold</button>
                <button>Lock</button>
                <button onClick={() => setPanel("rooms")}>Rooms</button>
              </div>
            )}

            <div className="panel-tabs">
              <button className={panel === "attendees" ? "active" : ""} onClick={() => setPanel("attendees")}>All</button>
              <button className={panel === "chat" ? "active" : ""} onClick={() => setPanel("chat")}>Chat</button>
              <button className={panel === "rooms" ? "active" : ""} onClick={() => setPanel("rooms")}>Rooms</button>
            </div>

            {panel === "attendees" && (
              <div className="attendee-list">
                <input placeholder="Search participants" />
                {people.concat(samplePeople).slice(0, 12).map((person, index) => (
                  <div className="attendee-row" key={`${person.email}-row-${index}`}>
                    <span>{person.name}</span>
                    <small>{person.email}</small>
                    <em>{person.mic ? "🎙" : "🔇"}</em>
                  </div>
                ))}
              </div>
            )}

            {panel === "rooms" && (
              <div className="rooms-panel">
                <h2>Breakout rooms</h2>
                <p>Use breakout rooms for Prayer Room, New Believers Room, Leadership Room, or Bible Class.</p>
                {canUseHostControls ? <Button>Setup breakout rooms</Button> : <p>Only hosts can setup breakout rooms.</p>}
              </div>
            )}

            {panel === "chat" && (
              <div className="chat-panel">
                <p><strong>Apostle Yuhana:</strong> Welcome everyone.</p>
                <p><strong>Member:</strong> Amen.</p>
                <input placeholder="Type a message..." />
              </div>
            )}
          </aside>
        )}
      </main>

      <footer className="live-toolbar">
        <button onClick={() => toggle("mic")} className={state.mic ? "active" : ""}>{state.mic ? "Mute" : "Unmute"}</button>
        <button onClick={() => toggle("camera")} className={state.camera ? "active" : ""}>{state.camera ? "Video On" : "Video Off"}</button>
        <button onClick={() => demoStore.setMeetingState({ speaker: state.speaker === "speaker" ? "earpiece" : "speaker" })}>{state.speaker === "speaker" ? "Speaker" : "Earpiece"}</button>
        {canUseHostControls && <button>Invite</button>}
        {canUseHostControls && <button>Share</button>}
        {canUseHostControls && <button onClick={() => toggle("recording")} className={state.recording ? "danger" : ""}>{state.recording ? "Stop Rec" : "Record"}</button>}
        <button onClick={() => setPanel("attendees")}>Attendees</button>
        <button onClick={() => setPanel("chat")}>Chat</button>
        <button>Reactions</button>
        {canUsePreferences && <button onClick={() => setPreferencesOpen(true)}>Preferences</button>}
        <button className="leave" onClick={() => setRoute("memberHome")}>Leave</button>
      </footer>

      {preferencesOpen && canUsePreferences && <PreferencesModal onClose={() => setPreferencesOpen(false)} />}
    </div>
  );
}
