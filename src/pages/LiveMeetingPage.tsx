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

const demoParticipants = [
  { name: "Member 1", email: "approved-member-1", role: "approved member", active: true, mic: false, symbol: "👤" },
  { name: "Member 2", email: "approved-member-2", role: "approved member", active: false, mic: false, symbol: "👤" },
  { name: "Prayer Servant", email: "prayer-servant", role: "prayer servant", active: false, mic: false, symbol: "🙏" },
  { name: "Media Servant", email: "media-servant", role: "media servant", active: false, mic: false, symbol: "🎧" }
];

const reactionOptions = [
  { label: "Amen", icon: "Amen" },
  { label: "Raise hand", icon: "✋" },
  { label: "Heart", icon: "♥" },
  { label: "Thanks", icon: "🙏" },
  { label: "Hallelujah", icon: "✝" }
];

function ToolbarButton({ icon, label, active, danger, onClick }: { icon: string; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button className={`toolbar-pill ${active ? "active" : ""} ${danger ? "danger" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
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
              <label>Display name<input value="Apostle Yuhana" readOnly /></label>
              <label>App language<select><option>English</option></select></label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Show meeting quality indicator</label>
            </div>
          )}
          {tab === "Profile" && (
            <div className="pref-info">
              <img src="/omideno7-logo.png" alt="OmideNo7" />
              <p><strong>Internal room</strong> omideno7-main-room</p>
              <p><strong>Access</strong> Approved users only</p>
              <p><strong>Owner</strong> Apostle Yuhana</p>
            </div>
          )}
          {tab === "Audio" && (
            <div className="pref-form">
              <label>Microphone<select><option>Same as system</option><option>Built-in microphone</option></select></label>
              <label>Speaker output<select><option>Phone speaker</option><option>Earpiece / receiver</option></select></label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Noise reduction</label>
              <label>Input volume<input type="range" defaultValue={55} /></label>
            </div>
          )}
          {tab === "Video" && (
            <div className="pref-form">
              <div className="video-preview-box">Camera preview</div>
              <label>Camera<select><option>Default camera</option><option>External camera</option></select></label>
            </div>
          )}
          {tab === "Meeting settings" && (
            <div className="pref-form">
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Waiting room required</label>
              <label className="toggle-line"><input type="checkbox" /> Entry/exit tone</label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Members join muted</label>
            </div>
          )}
          {tab === "Security" && (
            <div className="pref-form">
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Approved members only</label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Host admits from waiting room</label>
              <label className="toggle-line"><input type="checkbox" /> Lock meeting after start</label>
            </div>
          )}
          {tab === "Advanced" && (
            <div className="pref-form">
              <label>Network mode<select><option>Automatic</option><option>Low bandwidth</option><option>Audio first</option></select></label>
              <label className="toggle-line"><input type="checkbox" /> Show diagnostics</label>
            </div>
          )}
          {tab === "Updates" && (
            <div className="pref-info">
              <p><strong>OmideNo7 Meetings</strong></p>
              <p>Version 0.60.0</p>
              <p>Live meeting cleanup and meeting schedule upgrade.</p>
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
  const [panel, setPanel] = useState<"attendees" | "rooms" | "chat" | "reactions">("attendees");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState("Ready");
  const [lastReaction, setLastReaction] = useState("");

  const canUsePreferences = profile ? hostPreferenceRoles.includes(profile.role) : false;
  const canUseHostControls = profile ? hostControlRoles.includes(profile.role) : false;

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast("Ready"), 3000);
  }

  const people = useMemo(() => {
    const me = profile ? {
      name: profile.displayName,
      email: "You",
      role: profile.role.replaceAll("_", " "),
      active: false,
      mic: Boolean(state.mic),
      symbol: "✝"
    } : demoParticipants[0];

    return [me, ...demoParticipants].slice(0, 5);
  }, [profile, state.mic]);

  function updateState(patch: Record<string, any>, text: string) {
    demoStore.setMeetingState(patch);
    notify(text);
  }

  function toggle(key: string, onText: string, offText: string) {
    const next = !state[key];
    updateState({ [key]: next }, next ? onText : offText);
  }

  function sendReaction(label: string) {
    setLastReaction(label);
    notify(`Reaction sent: ${label}`);
  }

  return (
    <div className="live-shell refined-live">
      <header className="live-topbar">
        <div>
          <strong>OmideNo7 Main Room</strong>
          <span>{state.lowBandwidth ? "Audio-first low bandwidth mode" : "Secure internal app meeting UI"}</span>
        </div>
        <div className="live-status-line">
          <span className={state.mic ? "ok" : ""}>{state.mic ? "Mic on" : "Muted"}</span>
          <span className={state.camera ? "ok" : ""}>{state.camera ? "Camera on" : "Camera off"}</span>
          <span className={state.recording ? "rec" : ""}>{state.recording ? "Recording" : "Not recording"}</span>
        </div>
        <div className="live-topbar-actions">
          {canUseHostControls && <button className={state.lectureMode ? "danger" : ""} onClick={() => toggle("lectureMode", "Lecture Mode enabled. Members are locked muted.", "Lecture Mode disabled.")}>Lecture</button>}
          {canUseHostControls && <button onClick={() => toggle("lowBandwidth", "Low Bandwidth Mode enabled.", "Low Bandwidth Mode disabled.")}>Low BW</button>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "Hide panel" : "Show panel"}</button>
        </div>
      </header>

      <main className="live-main">
        <section className={sidebarOpen ? "participants-grid with-panel" : "participants-grid"}>
          {people.map((person, index) => (
            <article key={`${person.email}-${index}`} className={`participant-tile ${person.active ? "speaking" : ""}`}>
              <div className="participant-avatar clean-avatar"><span>{person.symbol}</span></div>
              <strong>{person.name}</strong>
              <span>{person.role}</span>
              <em className={person.mic ? "mic-on" : "mic-off"}>{person.mic ? "Mic on" : "Muted"}</em>
            </article>
          ))}
        </section>

        {sidebarOpen && (
          <aside className="attendees-panel">
            <div className="attendees-head">
              <strong>{panel === "rooms" ? "Breakout rooms" : panel === "chat" ? "Chat" : panel === "reactions" ? "Reactions" : "Attendees"} ({people.length})</strong>
              <button onClick={() => setSidebarOpen(false)}>×</button>
            </div>

            {canUseHostControls && (
              <div className="host-mini-controls">
                <button onClick={() => notify("Mute all request sent.")}>Mute all</button>
                <button onClick={() => notify("Meeting locked for new entry.")}>Lock</button>
                <button onClick={() => setPanel("rooms")}>Rooms</button>
                <button onClick={() => notify("Host controls opened.")}>Controls</button>
              </div>
            )}

            <div className="panel-tabs">
              <button className={panel === "attendees" ? "active" : ""} onClick={() => setPanel("attendees")}>All</button>
              <button className={panel === "chat" ? "active" : ""} onClick={() => setPanel("chat")}>Chat</button>
              <button className={panel === "reactions" ? "active" : ""} onClick={() => setPanel("reactions")}>React</button>
              <button className={panel === "rooms" ? "active" : ""} onClick={() => setPanel("rooms")}>Rooms</button>
            </div>

            {panel === "attendees" && (
              <div className="attendee-list">
                <input placeholder="Search participants" />
                {people.map((person, index) => (
                  <div className="attendee-row" key={`${person.email}-row-${index}`}>
                    <span>{person.name}</span>
                    <small>{person.role}</small>
                    <em>{person.mic ? "🎙" : "🔇"}</em>
                  </div>
                ))}
              </div>
            )}

            {panel === "rooms" && (
              <div className="rooms-panel">
                <h2>Breakout rooms</h2>
                <p>Create rooms such as Prayer Room, New Believers Room, Bible Class, or Leadership Room.</p>
                {canUseHostControls ? <Button onClick={() => notify("Breakout room setup will be connected in backend phase.")}>Setup rooms</Button> : <p>Only hosts can setup breakout rooms.</p>}
              </div>
            )}

            {panel === "chat" && (
              <div className="chat-panel">
                <p><strong>System:</strong> Chat UI is ready. Real chat will connect to backend messaging.</p>
                <input placeholder="Type a message..." onKeyDown={(event) => { if (event.key === "Enter") notify("Demo message sent."); }} />
              </div>
            )}

            {panel === "reactions" && (
              <div className="reactions-panel">
                {reactionOptions.map((reaction) => (
                  <button key={reaction.label} onClick={() => sendReaction(reaction.label)}>
                    <span>{reaction.icon}</span>
                    <strong>{reaction.label}</strong>
                  </button>
                ))}
                {lastReaction && <p>Last reaction: {lastReaction}</p>}
              </div>
            )}
          </aside>
        )}
      </main>

      <footer className="live-toolbar clean-toolbar">
        <ToolbarButton icon={state.mic ? "🎙" : "🔇"} label={state.mic ? "Mute" : "Unmute"} active={state.mic} onClick={() => toggle("mic", "Microphone unmuted.", "Microphone muted.")} />
        <ToolbarButton icon={state.camera ? "📷" : "🚫"} label={state.camera ? "Video on" : "Video off"} active={state.camera} onClick={() => toggle("camera", "Camera turned on.", "Camera turned off.")} />
        <ToolbarButton icon={state.speaker === "speaker" ? "🔊" : "📱"} label={state.speaker === "speaker" ? "Speaker" : "Earpiece"} onClick={() => updateState({ speaker: state.speaker === "speaker" ? "earpiece" : "speaker" }, state.speaker === "speaker" ? "Audio output set to earpiece." : "Audio output set to speaker.")} />
        {canUseHostControls && <ToolbarButton icon="✉" label="Invite" onClick={() => notify("Invite panel will use approved-member links only.")} />}
        {canUseHostControls && <ToolbarButton icon="⇧" label="Share" onClick={() => notify("Share options opened.")} />}
        {canUseHostControls && <ToolbarButton icon={state.recording ? "■" : "●"} label={state.recording ? "Stop rec" : "Record"} danger={state.recording} onClick={() => toggle("recording", "Recording started.", "Recording stopped.")} />}
        <ToolbarButton icon="☷" label="Attendees" onClick={() => { setSidebarOpen(true); setPanel("attendees"); notify("Attendees panel opened."); }} />
        <ToolbarButton icon="💬" label="Chat" onClick={() => { setSidebarOpen(true); setPanel("chat"); notify("Chat panel opened."); }} />
        <ToolbarButton icon="♥" label="Reactions" onClick={() => { setSidebarOpen(true); setPanel("reactions"); notify("Reactions opened."); }} />
        {canUsePreferences && <ToolbarButton icon="⚙" label="Preferences" onClick={() => setPreferencesOpen(true)} />}
        <button className="toolbar-pill leave" onClick={() => setRoute("memberHome")}><span>⏻</span><small>Leave</small></button>
      </footer>

      <div className="live-toast">{toast}</div>

      {preferencesOpen && canUsePreferences && <PreferencesModal onClose={() => setPreferencesOpen(false)} />}
    </div>
  );
}
