import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { demoStore } from "../services/demoStore";
import { meetingRealtimeService, stableParticipantId } from "../services/meetingRealtimeService";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";
import { useAppState } from "../app/AppState";
import {
  canControlMicrophones,
  canEndWholeMeeting,
  canManageWaitingRoom,
  isHostLike,
  roleLabel
} from "../services/roleAccess";

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
  avatarUrl?: string;
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

function MiniParticipantMenu({ participant, canHost, onClose, onAction }: { participant: Participant; canHost: boolean; onClose: () => void; onAction: (action: string, patch?: Partial<Participant>) => void }) {
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

function LeaveMeetingDialog({ canEnd, onClose, onLeaveOnly, onEndMeeting }: { canEnd: boolean; onClose: () => void; onLeaveOnly: () => void; onEndMeeting: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="leave-confirm-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Leave meeting?</h2>
        <p>{canEnd ? "Choose whether you only want to leave, or close the whole meeting for everyone." : "Members can only leave themselves. Ending the whole meeting is host-only."}</p>
        <div className="leave-choice-grid">
          <button onClick={onLeaveOnly}>Leave only me</button>
          {canEnd && <button className="danger" onClick={onEndMeeting}>End meeting for everyone</button>}
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

  const canHost = isHostLike(profile);
  const canWaiting = canManageWaitingRoom(profile);
  const canMicControl = canControlMicrophones(profile);
  const canEnd = canEndWholeMeeting(profile);

  const [panel, setPanel] = useState<"attendees" | "waiting" | "rooms" | "chat" | "reactions">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState("Ready");
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [waitingList, setWaitingList] = useState<WaitingPerson[]>(initialWaitingPeople);
  const [menuFor, setMenuFor] = useState<Participant | null>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<Participant | null>(null);
  const [chatScope, setChatScope] = useState<"everyone" | "hosts" | "direct">("everyone");
  const [directTargetId, setDirectTargetId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMode, setChatMode] = useState<"public" | "admin" | "closed">("public");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [selfHandRaised, setSelfHandRaised] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [controlMenu, setControlMenu] = useState<"none" | "mic" | "chat" | "grid">("none");
  const [gridSize, setGridSize] = useState<"compact" | "normal" | "large">("normal");
  const [realtimeStatus, setRealtimeStatus] = useState(meetingRealtimeService.isRealtimeReady() ? "realtime" : "local");

  useEffect(() => {
    let alive = true;

    async function refreshRealtime() {
      const [remotePeople, remoteMessages, myRemote] = await Promise.all([
        meetingRealtimeService.listParticipants(),
        meetingRealtimeService.listChat(),
        meetingRealtimeService.getMyParticipant(profile?.id)
      ]);

      if (!alive) return;

      if (myRemote) {
        demoStore.setMeetingState({
          mic: Boolean(myRemote.mic_on),
          camera: Boolean(myRemote.camera_on)
        });
        setSelfHandRaised(Boolean(myRemote.hand_raised));
      }

      if (remotePeople.length) {
        const mapped = remotePeople
          .filter((item) => item.profile_id !== profile?.id && item.status !== "removed" && item.status !== "blocked")
          .map((item) => ({
            id: item.id,
            name: item.display_name,
            role: item.role_label,
            status: item.status,
            mic: item.mic_on,
            camera: item.camera_on,
            canUnmute: item.allowed_mic,
            room: item.room_name,
            symbol: "👤",
            avatarUrl: item.avatar_url || undefined,
            handRaised: item.hand_raised,
            reaction: item.hand_raised ? "✋" : undefined
          } as Participant));
        setParticipants(mapped);
      }

      if (remoteMessages.length) {
        setChatMessages(remoteMessages.map((msg) => ({
          id: msg.id,
          from: msg.sender_name,
          to: msg.target_type === "everyone" ? "Everyone" : msg.target_type === "hosts" ? "Hosts/Admins" : "Direct",
          text: msg.message,
          time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : "",
          private: msg.target_type !== "everyone"
        })));
      }
    }

    meetingRealtimeService.upsertParticipant(profile, {
      mic_on: Boolean(state.mic),
      camera_on: Boolean(state.camera),
      hand_raised: selfHandRaised,
      avatar_url: profile?.avatarUrl || null,
      display_name: profile?.displayName || "User",
      role_label: roleLabel(profile?.role),
      status: "online"
    }).then(() => refreshRealtime());

    const unsubscribe = meetingRealtimeService.subscribe(refreshRealtime);
    const timer = window.setInterval(refreshRealtime, 3000);

    return () => {
      alive = false;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [profile?.id, profile?.avatarUrl, state.mic, state.camera, selfHandRaised]);

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
      role: roleLabel(profile?.role),
      status: "online",
      mic: Boolean(state.mic),
      camera: Boolean(state.camera),
      canUnmute: true,
      room: "Main Room",
      symbol: "✝️",
      avatarUrl: profile?.avatarUrl,
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
    meetingRealtimeService.upsertParticipant(profile, key === "mic" ? { mic_on: next } : key === "camera" ? { camera_on: next } : {});
  }

  function changeAllParticipants(patch: Partial<Participant>, text: string) {
    if (!canMicControl) {
      notify("Only authorized hosts can control microphones.");
      return;
    }
    setParticipants((current) => current.map((item) => ({ ...item, ...patch })));
    notify(text);
  }

  function toggleParticipantMic(participant: Participant) {
    if (!canMicControl) {
      notify("Only authorized hosts can control a participant microphone.");
      return;
    }
    setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, mic: !item.mic, canUnmute: !item.mic } : item));
    meetingRealtimeService.updateParticipant(participant.id, { mic_on: !participant.mic, allowed_mic: !participant.mic });
    notify(`${participant.name} microphone ${participant.mic ? "muted" : "allowed/unmuted"}.`);
  }

  function actOnParticipant(participant: Participant, action: string, patch?: Partial<Participant>) {
    if (patch && !canHost) {
      notify("Only host roles can perform this action.");
      setMenuFor(null);
      return;
    }

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
    if (!canWaiting) {
      notify("Only host or Door Servant can admit people.");
      return;
    }
    const newParticipant: Participant = {
      id: stableParticipantId(meetingRealtimeService.meetingId, `admitted-${person.id}`),
      name: person.name,
      role: "member",
      status: "online",
      mic: false,
      camera: false,
      canUnmute: false,
      room: "Main Room",
      symbol: "👤"
    };
    setParticipants((current) => [...current.filter((item) => item.id !== newParticipant.id), newParticipant]);
    meetingRealtimeService.upsertParticipant({
      id: `admitted-${person.id}`,
      displayName: person.name,
      fullName: person.name,
      email: "",
      role: "approved_member",
      status: "approved"
    } as any, {
      status: "online",
      display_name: person.name,
      role_label: "member",
      room_name: "Main Room"
    } as any);
    setWaitingList((current) => current.filter((item) => item.id !== person.id));
    meetingRealtimeService.raiseAlert(`${person.name} admitted`, "waiting_resolved");
    notify(`${person.name} admitted to meeting.`);
  }

  function rejectWaitingPerson(person: WaitingPerson) {
    if (!canWaiting) {
      notify("Only host or Door Servant can reject people.");
      return;
    }
    setWaitingList((current) => current.filter((item) => item.id !== person.id));
    meetingRealtimeService.raiseAlert(`${person.name} rejected`, "waiting_resolved");
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
      meetingRealtimeService.upsertParticipant(profile, { hand_raised: !selfHandRaised });
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
    if (chatMode === "closed" && !canHost) {
      notify("Chat is closed by host.");
      return;
    }
    if (chatMode === "admin" && !canHost && chatScope === "everyone") {
      notify("Public chat is host/admin-only right now.");
      return;
    }

    const directTarget = participants.find((item) => item.id === directTargetId);
    const to = chatScope === "hosts" ? "Hosts/Admins" : chatScope === "direct" ? directTarget?.name || "Selected person" : "Everyone";
    setChatMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), from: profile?.displayName || "You", to, text, time: new Date().toLocaleTimeString(), private: chatScope !== "everyone" }
    ]);
    meetingRealtimeService.sendChat(profile, text, chatScope === "hosts" ? "hosts" : chatScope === "direct" ? "direct" : "everyone", directTargetId || null);
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
    if (!canEnd) {
      notify("Only host roles can end the meeting for everyone.");
      return;
    }
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

  const visibleTabs = [
    { key: "attendees", label: "All", show: true },
    { key: "waiting", label: "Waiting", show: canWaiting },
    { key: "chat", label: "Chat", show: true },
    { key: "reactions", label: "React", show: true },
    { key: "rooms", label: "Rooms", show: true }
  ] as const;

  return (
    <div className={`live-shell refined-live control-live polished-live rebuilt-live grid-${gridSize}`}>
      <header className="live-topbar">
        <div>
          <strong>OmideNo7 Main Room</strong>
          <span>{state.lowBandwidth ? "Audio-first low bandwidth mode" : "Secure internal app meeting UI"} · {realtimeStatus}</span>
        </div>
        <div className="live-status-line">
          <span className={state.mic ? "ok" : ""}>{state.mic ? "Mic on" : "Muted"}</span>
          <span className={state.camera ? "ok" : ""}>{state.camera ? "Camera on" : "Camera off"}</span>
          {canWaiting && <span className={waitingList.length ? "waiting-top-badge" : ""} onClick={() => { setSidebarOpen(true); setPanel("waiting"); }}>Waiting {waitingList.length}</span>}
        </div>
        <div className="live-topbar-actions">
          {canMicControl && <button className={state.lectureMode ? "danger" : ""} onClick={() => toggle("lectureMode", "Lecture Mode enabled.", "Lecture Mode disabled.")}>Lecture</button>}
          {canHost && <button onClick={() => toggle("lowBandwidth", "Low Bandwidth Mode enabled.", "Low Bandwidth Mode disabled.")}>Low BW</button>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "Hide panel" : "Show panel"}</button>
        </div>
      </header>

      <main className={sidebarOpen ? "live-main side-open" : "live-main side-closed"}>
        <section className="participants-grid with-panel">
          {people.map((person) => (
            <article key={person.id} className={`participant-tile ${person.id === "me" ? "speaking" : ""} ${person.status === "blocked" ? "blocked-tile" : ""}`}>
              <button className="participant-click-zone" onClick={() => { setSidebarOpen(true); setPanel("attendees"); if (person.id !== "me") setSelectedAttendee(person); else notify("This is your tile."); }}>
                <div className="participant-avatar clean-avatar">
                  {person.avatarUrl ? <img src={person.avatarUrl} alt={person.name} /> : person.camera && person.id === "me" ? <span className="camera-placeholder">Camera on</span> : <span>{person.symbol}</span>}
                </div>
                <strong>{person.name} {person.handRaised || person.reaction ? <em className="id-reaction">{person.reaction || "✋"}</em> : null}</strong>
                <span>{person.role} · {person.room}</span>
                <em className={person.mic ? "mic-on" : "mic-off"}>{person.mic ? "Mic on" : person.canUnmute ? "Can unmute" : "Muted"}</em>
                <div className={`mini-eq ${person.mic ? "active" : ""}`}><i></i><i></i><i></i><i></i></div>
              </button>
            </article>
          ))}
        </section>

        {sidebarOpen && (
          <aside className="attendees-panel polished-side-panel rebuilt-side-panel">
            <div className="attendees-head compact-panel-head">
              <strong>{panelTitle()}</strong>
              <button onClick={() => setSidebarOpen(false)}>×</button>
            </div>

            {canHost && (
              <div className="compact-host-controls">
                {canMicControl && <button onClick={() => setControlMenu(controlMenu === "mic" ? "none" : "mic")}>Mic controls</button>}
                <button onClick={() => setControlMenu(controlMenu === "chat" ? "none" : "chat")}>Chat mode</button>
                <button onClick={() => setControlMenu(controlMenu === "grid" ? "none" : "grid")}>Grid size</button>
              </div>
            )}

            {controlMenu === "mic" && canMicControl && (
              <div className="host-control-dropdown">
                <button onClick={() => changeAllParticipants({ mic: false, canUnmute: false }, "All microphones muted and locked.")}>Mute all + lock</button>
                <button onClick={() => changeAllParticipants({ canUnmute: true }, "All members may unmute when allowed.")}>Allow all mics</button>
                <button onClick={() => changeAllParticipants({ canUnmute: false }, "Mic permission removed from all members.")}>Lock all mics</button>
                <button onClick={() => toggle("lectureMode", "Lecture Mode enabled.", "Lecture Mode disabled.")}>{state.lectureMode ? "Disable Lecture Mode" : "Enable Lecture Mode"}</button>
              </div>
            )}

            {controlMenu === "chat" && canHost && (
              <div className="host-control-dropdown">
                <button onClick={() => { setChatMode("public"); notify("Members can send public chat messages."); }}>Public chat</button>
                <button onClick={() => { setChatMode("admin"); notify("Only hosts/admins can send public chat."); }}>Admin-only chat</button>
                <button onClick={() => { setChatMode("closed"); notify("Members cannot send chat messages."); }}>Close chat sending</button>
              </div>
            )}

            {controlMenu === "grid" && canHost && (
              <div className="host-control-dropdown">
                <button onClick={() => setGridSize("compact")}>Compact grid</button>
                <button onClick={() => setGridSize("normal")}>Normal grid</button>
                <button onClick={() => setGridSize("large")}>Large grid</button>
              </div>
            )}

            <div className="panel-tabs rebuilt-tabs">
              {visibleTabs.filter((item) => item.show).map((item) => (
                <button key={item.key} className={panel === item.key ? "active" : ""} onClick={() => setPanel(item.key)}>{item.label}</button>
              ))}
            </div>

            <div className="side-panel-body">
              {panel === "waiting" && canWaiting && (
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
                    <div className="attendee-row attendee-line" key={`${person.id}-row`}>
                      <button className="attendee-main-button" onClick={() => person.id !== "me" ? setSelectedAttendee(person) : notify("You selected yourself.")}>
                        <span className="attendee-mini-avatar">{person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : person.symbol}</span>
                        <span>{person.name} {person.handRaised ? "✋" : ""}</span>
                        <small>{person.role} · {person.room}</small>
                      </button>
                      {canMicControl && person.id !== "me" && (
                        <button className={`speaker-toggle ${person.mic ? "on" : ""}`} onClick={() => toggleParticipantMic(person)} title="Toggle microphone">
                          {person.mic ? "🎙" : "🔇"}
                        </button>
                      )}
                    </div>
                  ))}

                  {selectedAttendee && (
                    <div className="side-attendee-actions">
                      <div className="mini-menu-head">
                        <strong>{selectedAttendee.name}</strong>
                        <button onClick={() => setSelectedAttendee(null)}>×</button>
                      </div>
                      <button onClick={() => { setPanel("chat"); setChatScope("direct"); setDirectTargetId(selectedAttendee.id); notify(`Direct message selected for ${selectedAttendee.name}.`); }}>Message</button>
                      {canHost && <button onClick={() => actOnParticipant(selectedAttendee, "Moved to Prayer Room", { room: "Prayer Room" })}>Move to Prayer Room</button>}
                      {canHost && <button onClick={() => actOnParticipant(selectedAttendee, "Moved to Main Room", { room: "Main Room" })}>Move to Main Room</button>}
                      {canMicControl && <button onClick={() => toggleParticipantMic(selectedAttendee)}>{selectedAttendee.mic ? "Mute microphone" : "Allow / unmute microphone"}</button>}
                      {canHost && <button className="danger" onClick={() => {
                        actOnParticipant(selectedAttendee, "Removed from meeting", { status: "removed" });
                        meetingRealtimeService.updateParticipant(selectedAttendee.id, { status: "removed" });
                        setSelectedAttendee(null);
                      }}>Kick / remove from meeting</button>}
                      {canHost && <button className="danger" onClick={() => {
                        actOnParticipant(selectedAttendee, "Blocked from meeting", { status: "blocked" });
                        meetingRealtimeService.updateParticipant(selectedAttendee.id, { status: "blocked" });
                        setSelectedAttendee(null);
                      }}>Block account in meeting</button>}
                    </div>
                  )}
                </div>
              )}
                    </div>
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
                  <div className="chat-rules"><span>{chatMode === "closed" ? "Chat closed for members" : chatMode === "admin" ? "Host/Admin-only public chat" : "Chat open"}</span></div>
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

                    <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={sendChatWithKeyboard} placeholder="Write a message..." />
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
        {canWaiting && <ToolbarButton icon="⏳" label="Waiting" onClick={() => { setSidebarOpen(true); setPanel("waiting"); }} />}
        <ToolbarButton icon="💬" label="Chat" onClick={() => { setSidebarOpen(true); setPanel("chat"); }} />
        <ToolbarButton icon="❤️" label="Reactions" onClick={() => { setSidebarOpen(true); setPanel("reactions"); }} />
        <button className="toolbar-pill leave" onClick={() => setLeaveDialogOpen(true)}><span>⏻</span><small>Leave</small></button>
      </footer>

      <div className="floating-reaction-layer">{floatingReactions.map((item) => <span key={item.id}>{item.icon}</span>)}</div>
      <div className="live-toast">{toast}</div>
      {leaveDialogOpen && <LeaveMeetingDialog canEnd={canEnd} onClose={() => setLeaveDialogOpen(false)} onLeaveOnly={leaveOnly} onEndMeeting={endMeetingForEveryone} />}
    </div>
  );
}
