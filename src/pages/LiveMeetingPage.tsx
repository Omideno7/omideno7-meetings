import { useMemo, useState } from "react";
import { demoStore } from "../services/demoStore";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";
import { useAppState } from "../app/AppState";
import { roles } from "../config/roles";

type Participant = {
  id: string;
  name: string;
  role: string;
  status: "online" | "waiting" | "blocked" | "removed";
  mic: boolean;
  camera: boolean;
  canUnmute: boolean;
  room: string;
  symbol: string;
};

type ChatMessage = {
  id: string;
  from: string;
  to: string;
  text: string;
  time: string;
  private?: boolean;
};

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

const initialParticipants: Participant[] = [
  {
    id: "approved-member-1",
    name: "Approved Member",
    role: "member",
    status: "online",
    mic: false,
    camera: false,
    canUnmute: false,
    room: "Main Room",
    symbol: "👤"
  },
  {
    id: "prayer-servant-demo",
    name: "Prayer Servant",
    role: "prayer servant",
    status: "online",
    mic: false,
    camera: false,
    canUnmute: false,
    room: "Main Room",
    symbol: "🙏"
  }
];

const reactionOptions = [
  { label: "Amen", icon: "🙏", message: "🙏 Amen" },
  { label: "Raise hand", icon: "✋", message: "✋ Raise hand" },
  { label: "Heart", icon: "♥", message: "♥" },
  { label: "Thanks", icon: "🙏", message: "🙏 Thanks" },
  { label: "Hallelujah", icon: "✝", message: "✝ Hallelujah" }
];

const chatEmojiOptions = ["♥", "👍", "⛪", "🙏", "✋", "Amen", "✝", "🔥"];

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
              <p><strong>Internal room</strong> OmideNo7 Main Room</p>
              <p><strong>Access</strong> Approved users only + Waiting Room</p>
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
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Members join muted</label>
              <label className="toggle-line"><input type="checkbox" /> Host approval required for camera</label>
            </div>
          )}
          {tab === "Security" && (
            <div className="pref-form">
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Approved members only</label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Hide member emails from other members</label>
              <label className="toggle-line"><input type="checkbox" defaultChecked /> Audit host actions</label>
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
              <p>Version 0.70.0</p>
              <p>Live controls, chat, participant actions, reactions and room controls.</p>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

function ParticipantActions({
  participant,
  canHost,
  onClose,
  onAction
}: {
  participant: Participant;
  canHost: boolean;
  onClose: () => void;
  onAction: (action: string, patch?: Partial<Participant>) => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className="participant-action-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{participant.name}</h2>
        <p>{participant.role} · {participant.room} · {participant.status}</p>

        <div className="participant-action-grid">
          <button onClick={() => onAction("Direct message")}>Message</button>
          {canHost && (
            <>
              <button onClick={() => onAction("Promoted to co-host", { role: "co-host" })}>Make Co-host</button>
              <button onClick={() => onAction("Moved to Main Room", { room: "Main Room" })}>Main Room</button>
              <button onClick={() => onAction("Moved to Prayer Room", { room: "Prayer Room" })}>Prayer Room</button>
              <button onClick={() => onAction("Moved to Bible Class Room", { room: "Bible Class Room" })}>Bible Class Room</button>
              <button onClick={() => onAction(participant.mic ? "Muted participant" : "Allowed participant to unmute", { mic: false, canUnmute: !participant.canUnmute })}>
                {participant.canUnmute ? "Remove mic permission" : "Allow mic"}
              </button>
              <button onClick={() => onAction("Participant removed from meeting", { status: "removed" })}>Remove</button>
              <button className="danger" onClick={() => onAction("Account blocked", { status: "blocked" })}>Block</button>
              {participant.status === "blocked" && <button onClick={() => onAction("Account unblocked", { status: "online" })}>Unblock</button>}
            </>
          )}
        </div>
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
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [chatScope, setChatScope] = useState<"everyone" | "hosts" | "direct">("everyone");
  const [directTargetId, setDirectTargetId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLocked, setChatLocked] = useState(false);
  const [adminOnlyChat, setAdminOnlyChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "m1", from: "System", to: "Everyone", text: "Chat is ready. Messages are local until backend messaging is connected.", time: "Now" }
  ]);

  const canUsePreferences = profile ? hostPreferenceRoles.includes(profile.role) : false;
  const canUseHostControls = profile ? hostControlRoles.includes(profile.role) : false;

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast("Ready"), 3500);
  }

  const people = useMemo(() => {
    const me: Participant = {
      id: "me",
      name: profile?.displayName || "You",
      role: profile?.role?.replaceAll("_", " ") || "member",
      status: "online",
      mic: Boolean(state.mic),
      camera: Boolean(state.camera),
      canUnmute: true,
      room: "Main Room",
      symbol: "✝"
    };

    return [me, ...participants.filter((item) => item.status !== "removed")];
  }, [profile, participants, state.mic, state.camera]);

  function updateMeetingState(patch: Record<string, any>, text: string) {
    demoStore.setMeetingState(patch);
    notify(text);
  }

  function toggle(key: string, onText: string, offText: string) {
    const next = !state[key];
    updateMeetingState({ [key]: next }, next ? onText : offText);
  }

  function changeAllParticipants(patch: Partial<Participant>, text: string) {
    setParticipants((current) => current.map((item) => ({ ...item, ...patch })));
    notify(text);
  }

  function actOnParticipant(participant: Participant, action: string, patch?: Partial<Participant>) {
    if (patch) {
      setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, ...patch } : item));
    }

    if (action === "Direct message") {
      setPanel("chat");
      setChatScope("direct");
      setDirectTargetId(participant.id);
      setSidebarOpen(true);
      notify(`Direct message selected for ${participant.name}.`);
    } else {
      notify(`${action}: ${participant.name}`);
    }
    setSelectedParticipant(null);
  }

  function sendReaction(label: string) {
    const reaction = reactionOptions.find((item) => item.label === label);
    const text = reaction?.message || label;
    notify(`Reaction sent: ${text}`);
    setChatMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), from: profile?.displayName || "You", to: "Everyone", text, time: new Date().toLocaleTimeString() }
    ]);
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) {
      notify("Write a message first.");
      return;
    }
    if (chatLocked && !canUseHostControls) {
      notify("Chat is closed by host.");
      return;
    }
    if (adminOnlyChat && !canUseHostControls && chatScope === "everyone") {
      notify("Public chat is host/admin-only right now.");
      return;
    }

    const directTarget = participants.find((item) => item.id === directTargetId);
    const to =
      chatScope === "hosts"
        ? "Hosts/Admins"
        : chatScope === "direct"
          ? directTarget?.name || "Selected person"
          : "Everyone";

    setChatMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        from: profile?.displayName || "You",
        to,
        text,
        time: new Date().toLocaleTimeString(),
        private: chatScope !== "everyone"
      }
    ]);
    setChatInput("");
    notify(`Message sent to ${to}.`);
  }

  return (
    <div className="live-shell refined-live control-live">
      <header className="live-topbar">
        <div>
          <strong>OmideNo7 Main Room</strong>
          <span>{state.lowBandwidth ? "Audio-first low bandwidth mode" : "Secure internal app meeting UI"}</span>
        </div>

        <div className="live-status-line">
          <span className={state.mic ? "ok" : ""}>{state.mic ? "Mic on" : "Muted"}</span>
          <span className={state.camera ? "ok" : ""}>{state.camera ? "Camera on" : "Camera off"}</span>
          <span className={state.recording ? "rec" : ""}>{state.recording ? "Recording" : "Not recording"}</span>
          <span>{chatLocked ? "Chat closed" : adminOnlyChat ? "Admin chat" : "Chat open"}</span>
        </div>

        <div className="live-topbar-actions">
          {canUseHostControls && <button className={state.lectureMode ? "danger" : ""} onClick={() => toggle("lectureMode", "Lecture Mode enabled. Members are locked muted.", "Lecture Mode disabled.")}>Lecture</button>}
          {canUseHostControls && <button onClick={() => toggle("lowBandwidth", "Low Bandwidth Mode enabled.", "Low Bandwidth Mode disabled.")}>Low BW</button>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "Hide panel" : "Show panel"}</button>
        </div>
      </header>

      <main className="live-main">
        <section className={sidebarOpen ? "participants-grid with-panel" : "participants-grid"}>
          {people.map((person) => (
            <article
              key={person.id}
              className={`participant-tile ${person.id === "me" ? "speaking" : ""} ${person.status === "blocked" ? "blocked-tile" : ""}`}
              onClick={() => person.id !== "me" ? setSelectedParticipant(person) : notify("This is your own tile.")}
            >
              <div className="participant-avatar clean-avatar"><span>{person.symbol}</span></div>
              <strong>{person.name}</strong>
              <span>{person.role} · {person.room}</span>
              <em className={person.mic ? "mic-on" : "mic-off"}>{person.mic ? "Mic on" : person.canUnmute ? "Can unmute" : "Muted"}</em>
            </article>
          ))}

          {people.length < 4 && (
            <article className="participant-tile waiting-tile">
              <div className="participant-avatar clean-avatar"><span>+</span></div>
              <strong>Waiting for approved members</strong>
              <span>No personal data shown</span>
              <em>Waiting room first</em>
            </article>
          )}
        </section>

        {sidebarOpen && (
          <aside className="attendees-panel">
            <div className="attendees-head">
              <strong>{panel === "rooms" ? "Breakout rooms" : panel === "chat" ? "Chat" : panel === "reactions" ? "Reactions" : "Attendees"} ({people.length})</strong>
              <button onClick={() => setSidebarOpen(false)}>×</button>
            </div>

            {canUseHostControls && (
              <div className="host-mini-controls host-grid-3">
                <button onClick={() => changeAllParticipants({ mic: false, canUnmute: false }, "All member microphones muted and locked.")}>Mute all</button>
                <button onClick={() => changeAllParticipants({ canUnmute: true }, "All members may request/unmute when allowed.")}>Allow all mic</button>
                <button onClick={() => changeAllParticipants({ canUnmute: false }, "Mic permission removed from all members.")}>Lock mics</button>
                <button onClick={() => { setChatLocked(!chatLocked); notify(!chatLocked ? "Chat closed by host." : "Chat opened by host."); }}>{chatLocked ? "Open chat" : "Close chat"}</button>
                <button onClick={() => { setAdminOnlyChat(!adminOnlyChat); notify(!adminOnlyChat ? "Chat is now host/admin-only." : "Public chat is allowed."); }}>{adminOnlyChat ? "Public chat" : "Admin chat"}</button>
                <button onClick={() => notify("Host controls ready. Click a participant for more actions.")}>Controls</button>
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
                {people.map((person) => (
                  <button className="attendee-row attendee-button" key={`${person.id}-row`} onClick={() => person.id !== "me" ? setSelectedParticipant(person) : notify("You selected yourself.")}>
                    <span>{person.name}</span>
                    <small>{person.role} · {person.room}</small>
                    <em>{person.status === "blocked" ? "⛔" : person.mic ? "🎙" : "🔇"}</em>
                  </button>
                ))}
              </div>
            )}

            {panel === "rooms" && (
              <div className="rooms-panel">
                <h2>Breakout rooms</h2>
                <p>Create or move people between rooms. Real backend room routing comes with the LiveKit phase.</p>
                {["Main Room", "Prayer Room", "Bible Class Room", "Leadership Room"].map((room) => (
                  <div className="room-card" key={room}>
                    <strong>{room}</strong>
                    <span>{people.filter((person) => person.room === room).length} participant(s)</span>
                  </div>
                ))}
              </div>
            )}

            {panel === "chat" && (
              <div className="chat-panel improved-chat">
                <div className="chat-rules">
                  <span>{chatLocked ? "Chat closed" : adminOnlyChat ? "Host/Admin-only public chat" : "Chat open"}</span>
                </div>

                <div className="chat-messages">
                  {chatMessages.map((msg) => (
                    <article key={msg.id} className={msg.private ? "private-message compact-message" : "compact-message"}>
                      <div className="compact-message-head">
                        <strong>{msg.from}</strong>
                        <small>{msg.to} · {msg.time}</small>
                      </div>
                      <p>{msg.text}</p>
                    </article>
                  ))}
                </div>

                <div className="chat-compose">
                  <div className="chat-emoji-row main-chat-emoji-row">
                    {chatEmojiOptions.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setChatInput((current) => `${current}${current ? " " : ""}${emoji}`)}>{emoji}</button>
                    ))}
                  </div>
                  <select value={chatScope} onChange={(event) => setChatScope(event.target.value as typeof chatScope)}>
                    <option value="everyone">Everyone</option>
                    <option value="hosts">Hosts/Admins only</option>
                    <option value="direct">Direct message</option>
                  </select>

                  {chatScope === "direct" && (
                    <select value={directTargetId} onChange={(event) => setDirectTargetId(event.target.value)}>
                      <option value="">Choose person</option>
                      {participants.filter((item) => item.status !== "removed").map((person) => (
                        <option key={person.id} value={person.id}>{person.name}</option>
                      ))}
                    </select>
                  )}

                  <div className="chat-emoji-row">
                    {chatEmojiOptions.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setChatInput((current) => `${current}${current ? " " : ""}${emoji}`)}>{emoji}</button>
                    ))}
                  </div>

                  <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Write a message..." />
                  <button onClick={sendChat}>Send message</button>
                </div>
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
              </div>
            )}
          </aside>
        )}
      </main>

      <footer className="live-toolbar clean-toolbar">
        <ToolbarButton icon={state.mic ? "🎙" : "🔇"} label={state.mic ? "Mute" : "Unmute"} active={state.mic} onClick={() => toggle("mic", "Microphone unmuted.", "Microphone muted.")} />
        <ToolbarButton icon={state.camera ? "📷" : "🚫"} label={state.camera ? "Video on" : "Video off"} active={state.camera} onClick={() => toggle("camera", "Camera turned on.", "Camera turned off.")} />
        <ToolbarButton icon={state.speaker === "speaker" ? "🔊" : "📱"} label={state.speaker === "speaker" ? "Speaker" : "Earpiece"} onClick={() => updateMeetingState({ speaker: state.speaker === "speaker" ? "earpiece" : "speaker" }, state.speaker === "speaker" ? "Audio output set to earpiece." : "Audio output set to speaker.")} />
        {canUseHostControls && <ToolbarButton icon="✉" label="Invite" onClick={() => notify("Invite will only be sent to approved members.")} />}
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
      {selectedParticipant && (
        <ParticipantActions
          participant={selectedParticipant}
          canHost={canUseHostControls}
          onClose={() => setSelectedParticipant(null)}
          onAction={(action, patch) => actOnParticipant(selectedParticipant, action, patch)}
        />
      )}
    </div>
  );
}
