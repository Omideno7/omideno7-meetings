import { useMemo, useState, type KeyboardEvent } from "react";
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
  reaction?: string;
  handRaised?: boolean;
};

type WaitingPerson = {
  id: string;
  name: string;
  note: string;
};

type ChatMessage = {
  id: string;
  from: string;
  to: string;
  text: string;
  time: string;
  private?: boolean;
};

type FloatingReaction = { id: string; icon: string };

const hostControlRoles = [roles.OWNER, roles.SENIOR_HOST, roles.MEETING_HOST, roles.CO_HOST];
const hostPreferenceRoles = [roles.OWNER, roles.SENIOR_HOST, roles.MEETING_HOST, roles.CO_HOST, roles.MEDIA_SERVANT, roles.DOOR_SERVANT];

const initialParticipants: Participant[] = [
  { id: "approved-member-1", name: "Approved Member", role: "member", status: "online", mic: false, camera: false, canUnmute: false, room: "Main Room", symbol: "👤" },
  { id: "prayer-servant-demo", name: "Prayer Servant", role: "prayer servant", status: "online", mic: false, camera: false, canUnmute: false, room: "Main Room", symbol: "🙏" }
];

const initialWaitingPeople: WaitingPerson[] = [
  { id: "wait-1", name: "Member waiting", note: "Entered waiting room now" }
];

const reactionOptions = [
  { label: "Amen", icon: "🙏", message: "🙏 Amen" },
  { label: "Raise hand", icon: "✋", message: "✋ Raise hand" },
  { label: "Heart", icon: "❤️", message: "❤️" },
  { label: "Like", icon: "👍", message: "👍" },
  { label: "Thanks", icon: "🙏", message: "🙏 Thanks" },
  { label: "Hallelujah", icon: "✝️", message: "✝️ Hallelujah" }
];

const chatEmojiOptions = ["❤️", "👍", "⛪", "🙏", "Amen", "✝️", "🔥", "🙌", "🕊️", "📖", "😊"];

function ToolbarButton({ icon, label, active, danger, onClick }: { icon: string; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button className={`toolbar-pill ${active ? "active" : ""} ${danger ? "danger" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
}

function MiniParticipantMenu({
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
    <div className="mini-context-menu">
      <div className="mini-menu-head">
        <strong>{participant.name}</strong>
        <button onClick={onClose}>×</button>
      </div>
      <button onClick={() => onAction("Direct message")}>Message</button>
      {canHost && (
        <>
          <button onClick={() => onAction("Promoted to co-host", { role: "co-host" })}>Make co-host</button>
          <button onClick={() => onAction("Moved to Main Room", { room: "Main Room" })}>Move: Main</button>
          <button onClick={() => onAction("Moved to Prayer Room", { room: "Prayer Room" })}>Move: Prayer</button>
          <button onClick={() => onAction("Moved to Bible Class Room", { room: "Bible Class Room" })}>Move: Bible</button>
          <button onClick={() => onAction(participant.canUnmute ? "Mic permission removed" : "Mic allowed", { canUnmute: !participant.canUnmute })}>
            {participant.canUnmute ? "Remove mic permission" : "Allow mic"}
          </button>
          <button onClick={() => onAction("Participant removed", { status: "removed" })}>Remove</button>
          <button className="danger" onClick={() => onAction("Account blocked", { status: "blocked" })}>Block</button>
          {participant.status === "blocked" && <button onClick={() => onAction("Account unblocked", { status: "online" })}>Unblock</button>}
        </>
      )}
    </div>
  );
}

function PreferencesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="preferences-modal small-preferences">
        <button className="modal-close" onClick={onClose}>×</button>
        <main>
          <h2>Meeting Settings</h2>
          <p>These settings are UI-ready. Real meeting engine settings are connected in the LiveKit phase.</p>
          <div className="pref-form">
            <label>Network mode<select><option>Automatic</option><option>Low bandwidth</option><option>Audio first</option></select></label>
            <label className="toggle-line"><input type="checkbox" defaultChecked /> Approved users only</label>
            <label className="toggle-line"><input type="checkbox" defaultChecked /> Waiting room required</label>
          </div>
        </main>
      </section>
    </div>
  );
}

function LeaveMeetingDialog({
  onClose,
  onLeaveOnly,
  onEndMeeting
}: {
  onClose: () => void;
  onLeaveOnly: () => void;
  onEndMeeting: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className="leave-confirm-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Leave meeting?</h2>
        <p>Choose whether you only want to leave, or close the whole meeting for everyone.</p>
        <div className="leave-choice-grid">
          <button onClick={onLeaveOnly}>Leave only me</button>
          <button className="danger" onClick={onEndMeeting}>End meeting for everyone</button>
          <button className="ghost" onClick={onClose}>Cancel</button>
        </div>
      </section>
    </div>
  );
}

export function LiveMeetingPage() {
  const { profile, setRoute } = useAppState();
  useDemoStoreVersion();
  const state = demoStore.getMeetingState();

  const [panel, setPanel] = useState<"attendees" | "waiting" | "rooms" | "chat" | "reactions">("chat");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState("Ready");
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [waitingList, setWaitingList] = useState<WaitingPerson[]>(initialWaitingPeople);
  const [menuFor, setMenuFor] = useState<Participant | null>(null);
  const [chatScope, setChatScope] = useState<"everyone" | "hosts" | "direct">("everyone");
  const [directTargetId, setDirectTargetId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMode, setChatMode] = useState<"public" | "admin" | "closed">("public");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [selfHandRaised, setSelfHandRaised] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [controlMenu, setControlMenu] = useState<"none" | "mic" | "chat">("none");

  const canUsePreferences = profile ? hostPreferenceRoles.includes(profile.role) : false;
  const canUseHostControls = profile ? hostControlRoles.includes(profile.role) : false;

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast("Ready"), 3000);
  }

  function addFloating(icon: string) {
    const item = { id: crypto.randomUUID(), icon };
    setFloatingReactions((current) => [...current, item]);
    window.setTimeout(() => setFloatingReactions((current) => current.filter((reaction) => reaction.id !== item.id)), 2400);
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
      symbol: "✝️",
      reaction: selfHandRaised ? "✋" : undefined,
      handRaised: selfHandRaised
    };

    return [me, ...participants.filter((item) => item.status !== "removed")];
  }, [profile, participants, state.mic, state.camera, selfHandRaised]);

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
    if (patch) setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, ...patch } : item));

    if (action === "Direct message") {
      setPanel("chat");
      setChatScope("direct");
      setDirectTargetId(participant.id);
      setSidebarOpen(true);
      notify(`Direct message selected for ${participant.name}.`);
    } else {
      notify(`${action}: ${participant.name}`);
    }
    setMenuFor(null);
  }

  function admitWaitingPerson(person: WaitingPerson) {
    const newParticipant: Participant = {
      id: `admitted-${person.id}`,
      name: person.name,
      role: "member",
      status: "online",
      mic: false,
      camera: false,
      canUnmute: false,
      room: "Main Room",
      symbol: "👤"
    };

    setParticipants((current) => [...current, newParticipant]);
    setWaitingList((current) => current.filter((item) => item.id !== person.id));
    notify(`${person.name} admitted to meeting.`);
  }

  function rejectWaitingPerson(person: WaitingPerson) {
    setWaitingList((current) => current.filter((item) => item.id !== person.id));
    notify(`${person.name} rejected from waiting room.`);
  }

  function messageWaitingPerson(person: WaitingPerson) {
    setPanel("chat");
    setChatScope("direct");
    setDirectTargetId("");
    setChatInput(`Message to ${person.name}: `);
    notify(`Write a message for ${person.name}.`);
  }

  function sendReaction(label: string) {
    const reaction = reactionOptions.find((item) => item.label === label);
    if (!reaction) return;

    if (reaction.label === "Raise hand") {
      setSelfHandRaised((current) => !current);
      notify(!selfHandRaised ? "Hand raised. Host can see it beside your ID." : "Hand lowered.");
      return;
    }

    addFloating(reaction.icon);
    setChatMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), from: profile?.displayName || "You", to: "Everyone", text: reaction.message, time: new Date().toLocaleTimeString() }
    ]);
    notify(`Reaction sent: ${reaction.message}`);
  }

  function appendEmoji(emoji: string) {
    setChatInput((current) => `${current}${current ? " " : ""}${emoji}`);
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) {
      notify("Write a message first.");
      return;
    }
    if (chatMode === "closed" && !canUseHostControls) {
      notify("Chat is closed by host.");
      return;
    }
    if (chatMode === "admin" && !canUseHostControls && chatScope === "everyone") {
      notify("Public chat is host/admin-only right now.");
      return;
    }

    const directTarget = participants.find((item) => item.id === directTargetId);
    const to = chatScope === "hosts" ? "Hosts/Admins" : chatScope === "direct" ? directTarget?.name || "Selected person" : "Everyone";

    setChatMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), from: profile?.displayName || "You", to, text, time: new Date().toLocaleTimeString(), private: chatScope !== "everyone" }
    ]);
    setChatInput("");
    notify(`Message sent to ${to}.`);
  }

  function sendChatWithKeyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  }

  function leaveOnly() {
    setLeaveDialogOpen(false);
    setRoute("memberHome");
  }

  function endMeetingForEveryone() {
    setLeaveDialogOpen(false);
    updateMeetingState({ mic: false, camera: false, recording: false }, "Meeting ended for everyone.");
    setRoute("memberHome");
  }

  function panelTitle() {
    if (panel === "rooms") return "Breakout rooms";
    if (panel === "chat") return `Chat (${chatMessages.length})`;
    if (panel === "reactions") return "Reactions";
    if (panel === "waiting") return `Waiting Room (${waitingList.length})`;
    return "Attendees";
  }

  return (
    <div className="live-shell refined-live control-live polished-live rebuilt-live">
      <header className="live-topbar">
        <div>
          <strong>OmideNo7 Main Room</strong>
          <span>{state.lowBandwidth ? "Audio-first low bandwidth mode" : "Secure internal app meeting UI"}</span>
        </div>
        <div className="live-status-line">
          <span className={state.mic ? "ok" : ""}>{state.mic ? "Mic on" : "Muted"}</span>
          <span className={state.camera ? "ok" : ""}>{state.camera ? "Camera on" : "Camera off"}</span>
          <span className={state.recording ? "rec" : ""}>{state.recording ? "Recording" : "Not recording"}</span>
          <span className={waitingList.length ? "waiting-top-badge" : ""} onClick={() => { setSidebarOpen(true); setPanel("waiting"); }}>Waiting {waitingList.length}</span>
        </div>
        <div className="live-topbar-actions">
          {canUseHostControls && <button className={state.lectureMode ? "danger" : ""} onClick={() => toggle("lectureMode", "Lecture Mode enabled.", "Lecture Mode disabled.")}>Lecture</button>}
          {canUseHostControls && <button onClick={() => toggle("lowBandwidth", "Low Bandwidth Mode enabled.", "Low Bandwidth Mode disabled.")}>Low BW</button>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "Hide panel" : "Show panel"}</button>
        </div>
      </header>

      <main className={sidebarOpen ? "live-main side-open" : "live-main side-closed"}>
        <section className="participants-grid with-panel">
          {people.map((person) => (
            <article key={person.id} className={`participant-tile ${person.id === "me" ? "speaking" : ""} ${person.status === "blocked" ? "blocked-tile" : ""}`}>
              <button className="participant-click-zone" onClick={() => person.id !== "me" ? setMenuFor(person) : notify("This is your tile.")}>
                <div className="participant-avatar clean-avatar">
                  {person.camera && person.id === "me" ? <span className="camera-placeholder">Camera on</span> : <span>{person.symbol}</span>}
                </div>
                <strong>{person.name} {person.handRaised || person.reaction ? <em className="id-reaction">{person.reaction || "✋"}</em> : null}</strong>
                <span>{person.role} · {person.room}</span>
                <em className={person.mic ? "mic-on" : "mic-off"}>{person.mic ? "Mic on" : person.canUnmute ? "Can unmute" : "Muted"}</em>
                <div className={`mini-eq ${person.mic ? "active" : ""}`}><i></i><i></i><i></i><i></i></div>
              </button>
              {menuFor?.id === person.id && (
                <MiniParticipantMenu participant={person} canHost={canUseHostControls} onClose={() => setMenuFor(null)} onAction={(action, patch) => actOnParticipant(person, action, patch)} />
              )}
            </article>
          ))}
        </section>

        {sidebarOpen && (
          <aside className="attendees-panel polished-side-panel rebuilt-side-panel">
            <div className="attendees-head compact-panel-head">
              <strong>{panelTitle()}</strong>
              <button onClick={() => setSidebarOpen(false)}>×</button>
            </div>

            {canUseHostControls && (
              <div className="compact-host-controls">
                <button onClick={() => setControlMenu(controlMenu === "mic" ? "none" : "mic")}>Mic controls</button>
                <button onClick={() => setControlMenu(controlMenu === "chat" ? "none" : "chat")}>Chat mode</button>
                <button onClick={() => notify("Click participant tile for individual controls.")}>User controls</button>
              </div>
            )}

            {controlMenu === "mic" && (
              <div className="host-control-dropdown">
                <button onClick={() => changeAllParticipants({ mic: false, canUnmute: false }, "All microphones muted and locked.")}>Mute all + lock</button>
                <button onClick={() => changeAllParticipants({ canUnmute: true }, "All members may unmute when allowed.")}>Allow all mics</button>
                <button onClick={() => changeAllParticipants({ canUnmute: false }, "Mic permission removed from all members.")}>Lock all mics</button>
                <button onClick={() => toggle("lectureMode", "Lecture Mode enabled.", "Lecture Mode disabled.")}>{state.lectureMode ? "Disable Lecture Mode" : "Enable Lecture Mode"}</button>
              </div>
            )}

            {controlMenu === "chat" && (
              <div className="host-control-dropdown">
                <button onClick={() => { setChatMode("public"); notify("Chat is public."); }}>Public chat</button>
                <button onClick={() => { setChatMode("admin"); notify("Chat is host/admin-only."); }}>Admin-only chat</button>
                <button onClick={() => { setChatMode("closed"); notify("Chat is closed."); }}>Close chat</button>
              </div>
            )}

            <div className="panel-tabs rebuilt-tabs">
              <button className={panel === "attendees" ? "active" : ""} onClick={() => setPanel("attendees")}>All</button>
              <button className={panel === "waiting" ? "active" : ""} onClick={() => setPanel("waiting")}>Waiting</button>
              <button className={panel === "chat" ? "active" : ""} onClick={() => setPanel("chat")}>Chat</button>
              <button className={panel === "reactions" ? "active" : ""} onClick={() => setPanel("reactions")}>React</button>
              <button className={panel === "rooms" ? "active" : ""} onClick={() => setPanel("rooms")}>Rooms</button>
            </div>

            <div className="side-panel-body">
              {panel === "waiting" && (
                <div className="waiting-live-list">
                  {waitingList.length === 0 ? (
                    <p className="empty-chat">No one is waiting now.</p>
                  ) : (
                    waitingList.map((person) => (
                      <article key={person.id} className="waiting-live-card visible-waiting-card">
                        <strong>{person.name}</strong>
                        <span>{person.note}</span>
                        <small>ID: {person.id}</small>
                        <div className="button-row compact-row">
                          <button onClick={() => admitWaitingPerson(person)}>Admit</button>
                          <button onClick={() => messageWaitingPerson(person)}>Message</button>
                          <button onClick={() => rejectWaitingPerson(person)}>Reject</button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}

              {panel === "attendees" && (
                <div className="attendee-list">
                  <input placeholder="Search participants" />
                  {people.map((person) => (
                    <button className="attendee-row attendee-button" key={`${person.id}-row`} onClick={() => person.id !== "me" ? setMenuFor(person) : notify("You selected yourself.")}>
                      <span>{person.name} {person.handRaised ? "✋" : ""}</span>
                      <small>{person.role} · {person.room}</small>
                      <em>{person.status === "blocked" ? "⛔" : person.mic ? "🎙" : "🔇"}</em>
                    </button>
                  ))}
                </div>
              )}

              {panel === "rooms" && (
                <div className="rooms-panel">
                  {["Main Room", "Prayer Room", "Bible Class Room", "Leadership Room"].map((room) => (
                    <div className="room-card" key={room}>
                      <strong>{room}</strong>
                      <span>{people.filter((person) => person.room === room).length} participant(s)</span>
                    </div>
                  ))}
                </div>
              )}

              {panel === "chat" && (
                <div className="chat-panel rebuilt-chat-panel">
                  <div className="chat-rules"><span>{chatMode === "closed" ? "Chat closed" : chatMode === "admin" ? "Host/Admin-only public chat" : "Chat open"}</span></div>
                  <div className="chat-messages rebuilt-chat-messages">
                    {chatMessages.length === 0 ? (
                      <p className="empty-chat">No messages yet. Write below and press Enter or Send.</p>
                    ) : (
                      chatMessages.map((msg) => (
                        <article key={msg.id} className={msg.private ? "private-message compact-message" : "compact-message"}>
                          <div className="compact-message-head">
                            <strong>{msg.from}</strong>
                            <small>{msg.to} · {msg.time}</small>
                          </div>
                          <p>{msg.text}</p>
                        </article>
                      ))
                    )}
                  </div>
                  <div className="chat-compose rebuilt-chat-compose">
                    <select value={chatScope} onChange={(event) => setChatScope(event.target.value as typeof chatScope)}>
                      <option value="everyone">Everyone</option>
                      <option value="hosts">Hosts/Admins only</option>
                      <option value="direct">Direct message</option>
                    </select>

                    {chatScope === "direct" && (
                      <select value={directTargetId} onChange={(event) => setDirectTargetId(event.target.value)}>
                        <option value="">Choose person</option>
                        {participants.filter((item) => item.status !== "removed").map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                      </select>
                    )}

                    <div className="chat-emoji-row main-chat-emoji-row">
                      {chatEmojiOptions.map((emoji) => <button key={emoji} type="button" onClick={() => appendEmoji(emoji)}>{emoji}</button>)}
                    </div>

                    <textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={sendChatWithKeyboard}
                      placeholder="Write a message... Enter sends, Shift+Enter makes a new line."
                    />
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
            </div>
          </aside>
        )}
      </main>

      <footer className="live-toolbar clean-toolbar">
        <ToolbarButton icon={state.mic ? "🎙" : "🔇"} label={state.mic ? "Mute" : "Unmute"} active={state.mic} onClick={() => toggle("mic", "Microphone unmuted.", "Microphone muted.")} />
        <ToolbarButton icon={state.camera ? "📷" : "🚫"} label={state.camera ? "Video on" : "Video off"} active={state.camera} onClick={() => toggle("camera", "Camera preview placeholder enabled. Real live video connects in LiveKit phase.", "Camera turned off.")} />
        <ToolbarButton icon="☷" label="Attendees" onClick={() => { setSidebarOpen(true); setPanel("attendees"); }} />
        <ToolbarButton icon="⏳" label="Waiting" onClick={() => { setSidebarOpen(true); setPanel("waiting"); }} />
        <ToolbarButton icon="💬" label="Chat" onClick={() => { setSidebarOpen(true); setPanel("chat"); }} />
        <ToolbarButton icon="❤️" label="Reactions" onClick={() => { setSidebarOpen(true); setPanel("reactions"); }} />
        {canUsePreferences && <ToolbarButton icon="⚙" label="Settings" onClick={() => setPreferencesOpen(true)} />}
        <button className="toolbar-pill leave" onClick={() => setLeaveDialogOpen(true)}><span>⏻</span><small>Leave</small></button>
      </footer>

      <div className="floating-reaction-layer">{floatingReactions.map((item) => <span key={item.id}>{item.icon}</span>)}</div>
      <div className="live-toast">{toast}</div>
      {preferencesOpen && canUsePreferences && <PreferencesModal onClose={() => setPreferencesOpen(false)} />}
      {leaveDialogOpen && <LeaveMeetingDialog onClose={() => setLeaveDialogOpen(false)} onLeaveOnly={leaveOnly} onEndMeeting={endMeetingForEveryone} />}
    </div>
  );
}
