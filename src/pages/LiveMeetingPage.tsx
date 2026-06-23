import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { demoStore } from "../services/demoStore";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";
import { useAppState } from "../app/AppState";
import {
  canControlMicrophones,
  canEndWholeMeeting,
  canManageWaitingRoom,
  isHostLike,
  roleLabel
} from "../services/roleAccess";
import { meetingRoomService, roomParticipantId, type RoomParticipant } from "../services/meetingRoomService";
import { RealLiveKitRoom } from "../components/livekit/RealLiveKitRoom";

type Participant = {
  id: string;
  name: string;
  role: string;
  status: "online" | "waiting" | "blocked" | "removed" | "left";
  mic: boolean;
  camera: boolean;
  canUnmute: boolean;
  room: string;
  symbol: string;
  avatarUrl?: string;
  reaction?: string;
  handRaised?: boolean;
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

const reactionOptions = [
  { label: "Amen", icon: "🙏", message: "🙏 Amen" },
  { label: "Raise hand", icon: "✋", message: "✋ Raise hand" },
  { label: "Heart", icon: "❤️", message: "❤️" },
  { label: "Like", icon: "👍", message: "👍" },
  { label: "Thanks", icon: "🙏", message: "🙏 Thanks" },
  { label: "Hallelujah", icon: "✝️", message: "✝️ Hallelujah" }
];

const chatEmojiOptions = ["❤️", "👍", "⛪", "🙏", "Amen", "✝️", "🔥", "🙌", "🕊️", "📖", "😊"];

function toParticipant(row: RoomParticipant): Participant {
  return {
    id: row.id,
    name: row.display_name,
    role: row.role_label,
    status: row.status,
    mic: row.mic_on,
    camera: row.camera_on,
    canUnmute: row.allowed_mic,
    room: row.room_name,
    symbol: "👤",
    avatarUrl: row.avatar_url || undefined,
    reaction: row.hand_raised ? "✋" : undefined,
    handRaised: row.hand_raised
  };
}

function ToolbarButton({ icon, label, active, danger, onClick }: { icon: string; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button className={`toolbar-pill ${active ? "active" : ""} ${danger ? "danger" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <small>{label}</small>
    </button>
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

function MemberWaitingGate({ status, onEnterWaiting, onRefresh, onBack }: { status: string; onEnterWaiting: () => void; onRefresh: () => void; onBack: () => void }) {
  return (
    <div className="live-shell rebuilt-live member-waiting-live">
      <section className="member-waiting-card">
        <h1>Waiting Room</h1>
        <p>You must wait for a host to admit you before entering the main meeting.</p>
        <strong className={status === "waiting" ? "alert-red" : status === "online" ? "alert-green" : ""}>
          {status === "online" ? "You are admitted. Opening meeting..." : status === "waiting" ? "Waiting for host approval..." : "You are not in the waiting room yet."}
        </strong>
        <div className="button-row">
          <button onClick={onEnterWaiting}>Enter Waiting Room</button>
          <button onClick={onRefresh}>Refresh Status</button>
          <button className="ghost" onClick={onBack}>Back to Home</button>
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [waitingParticipants, setWaitingParticipants] = useState<Participant[]>([]);
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
  const [liveKitConnected, setLiveKitConnected] = useState(false);
  const [myRoomStatus, setMyRoomStatus] = useState<"unknown" | "waiting" | "online" | "removed" | "blocked" | "left">("unknown");

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast("Ready"), 3000);
  }

  async function handleLiveKitMediaState(next: { mic: boolean; camera: boolean }) {
    demoStore.setMeetingState({ mic: next.mic, camera: next.camera });
    await meetingRoomService.enterOnline(profile, {
      mic_on: next.mic,
      camera_on: next.camera,
      hand_raised: selfHandRaised,
      avatar_url: profile?.avatarUrl || null,
      display_name: profile?.displayName || "User",
      role_label: roleLabel(profile?.role)
    });
    await refreshRoomState();
  }

  function sendLiveKitControl(action: "mic" | "camera" | "leave") {
    window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action } }));
  }

  async function refreshRoomState() {
    const [rows, messages, myRow, roomSettings] = await Promise.all([
      meetingRoomService.listParticipants(),
      meetingRoomService.listChat(),
      meetingRoomService.getMyRow(profile),
      meetingRoomService.getSettings()
    ]);

    if (roomSettings?.chat_mode) {
      setChatMode(roomSettings.chat_mode);
    }

    if (roomSettings && roomSettings.live_open === false && !canHost) {
      notify("The host ended the meeting.");
      setRoute("memberHome");
      return;
    }

    if (myRow) {
      setMyRoomStatus(myRow.status);
      demoStore.setMeetingState({ mic: myRow.mic_on, camera: myRow.camera_on });
      setSelfHandRaised(Boolean(myRow.hand_raised));
    } else if (canHost) {
      setMyRoomStatus("online");
    } else {
      setMyRoomStatus("unknown");
    }

    const online = rows.filter((row) => row.status === "online");
    const waiting = rows.filter((row) => row.status === "waiting");

    const meId = roomParticipantId(meetingRoomService.meetingId, profile?.id);
    const meFromRemote = online.find((row) => row.id === meId);

    const me: Participant = {
      id: meId,
      name: profile?.displayName || "You",
      role: roleLabel(profile?.role),
      status: "online",
      mic: meFromRemote?.mic_on ?? Boolean(state.mic),
      camera: meFromRemote?.camera_on ?? Boolean(state.camera),
      canUnmute: meFromRemote?.allowed_mic ?? true,
      room: meFromRemote?.room_name || "Main Room",
      symbol: "✝️",
      avatarUrl: meFromRemote?.avatar_url || profile?.avatarUrl,
      reaction: (meFromRemote?.hand_raised || selfHandRaised) ? "✋" : undefined,
      handRaised: meFromRemote?.hand_raised || selfHandRaised
    };

    const mappedOnline = online.filter((row) => row.id !== meId).map(toParticipant);
    setParticipants([me, ...mappedOnline]);
    setWaitingParticipants(waiting.map(toParticipant));

    if (messages.length) {
      setChatMessages(messages.map((msg) => ({
        id: msg.id,
        from: msg.sender_name,
        to: msg.target_type === "everyone" ? "Everyone" : msg.target_type === "hosts" ? "Hosts/Admins" : "Direct",
        text: msg.message,
        time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : "",
        private: msg.target_type !== "everyone"
      })));
    }
  }

  useEffect(() => {
    let alive = true;

    async function tick() {
      if (!alive) return;

      if (canHost) {
        await meetingRoomService.enterOnline(profile, {
          mic_on: Boolean(state.mic),
          camera_on: Boolean(state.camera),
          hand_raised: selfHandRaised,
          avatar_url: profile?.avatarUrl || null,
          display_name: profile?.displayName || "Host",
          role_label: roleLabel(profile?.role)
        });
      }

      await refreshRoomState();
    }

    tick();
    const unsubscribe = meetingRoomService.subscribe(() => refreshRoomState());
    const timer = window.setInterval(() => refreshRoomState(), 2500);

    return () => {
      alive = false;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [profile?.id, profile?.avatarUrl, canHost]);

  async function enterWaitingRoom() {
    await meetingRoomService.joinWaiting(profile);
    await meetingRoomService.raiseAlert(`${profile?.displayName || "A member"} is waiting for admission.`, "waiting_room", "red", "active");
    setMyRoomStatus("waiting");
    notify("You entered the waiting room.");
    await refreshRoomState();
  }

  const memberBlockedFromMain = !canHost && myRoomStatus !== "online";
  if (memberBlockedFromMain) {
    return (
      <MemberWaitingGate
        status={myRoomStatus}
        onEnterWaiting={enterWaitingRoom}
        onRefresh={refreshRoomState}
        onBack={() => setRoute("memberHome")}
      />
    );
  }

  function addFloating(icon: string) {
    const item = { id: crypto.randomUUID(), icon };
    setFloatingReactions((current) => [...current, item]);
    window.setTimeout(() => setFloatingReactions((current) => current.filter((reaction) => reaction.id !== item.id)), 2400);
  }

  async function updateOwnState(patch: Record<string, boolean>) {
    await meetingRoomService.enterOnline(profile, {
      mic_on: patch.mic ?? Boolean(state.mic),
      camera_on: patch.camera ?? Boolean(state.camera),
      hand_raised: patch.hand ?? selfHandRaised,
      avatar_url: profile?.avatarUrl || null,
      display_name: profile?.displayName || "User",
      role_label: roleLabel(profile?.role)
    });
    await refreshRoomState();
  }

  function toggle(key: string, onText: string, offText: string) {
    const next = !state[key];
    demoStore.setMeetingState({ [key]: next });
    updateOwnState(key === "mic" ? { mic: next } : key === "camera" ? { camera: next } : {});
    notify(next ? onText : offText);
  }

  async function changeAllParticipants(patch: Partial<Participant>, text: string) {
    if (!canMicControl) return notify("Only authorized hosts can control microphones.");
    for (const person of participants.filter((item) => item.id !== roomParticipantId(meetingRoomService.meetingId, profile?.id))) {
      await meetingRoomService.updateParticipant(person.id, {
        mic_on: patch.mic ?? person.mic,
        allowed_mic: patch.canUnmute ?? person.canUnmute
      });
    }
    notify(text);
    await refreshRoomState();
  }

  async function toggleParticipantMic(participant: Participant) {
    if (!canMicControl) return notify("Only authorized hosts can control a participant microphone.");
    await meetingRoomService.updateParticipant(participant.id, {
      mic_on: !participant.mic,
      allowed_mic: !participant.mic
    });
    notify(`${participant.name} microphone ${participant.mic ? "muted" : "allowed/unmuted"}.`);
    await refreshRoomState();
  }

  async function admitWaitingPerson(person: Participant) {
    if (!canWaiting) return notify("Only host or Door Servant can admit people.");
    await meetingRoomService.admitParticipant(person.id);
    notify(`${person.name} admitted to meeting.`);
    await refreshRoomState();
  }

  async function rejectWaitingPerson(person: Participant) {
    if (!canWaiting) return notify("Only host or Door Servant can reject people.");
    await meetingRoomService.rejectParticipant(person.id);
    notify(`${person.name} rejected from waiting room.`);
    await refreshRoomState();
  }

  async function removeParticipant(person: Participant) {
    if (!canHost) return notify("Only host roles can remove participants.");
    await meetingRoomService.removeParticipant(person.id);
    setSelectedAttendee(null);
    notify(`${person.name} removed from meeting.`);
    await refreshRoomState();
  }

  async function moveParticipant(person: Participant, roomName: string) {
    if (!canHost) return notify("Only host roles can move participants.");
    await meetingRoomService.updateParticipant(person.id, { room_name: roomName });
    notify(`${person.name} moved to ${roomName}.`);
    await refreshRoomState();
  }

  async function sendReaction(label: string) {
    const reaction = reactionOptions.find((item) => item.label === label);
    if (!reaction) return;

    if (reaction.label === "Raise hand") {
      const next = !selfHandRaised;
      setSelfHandRaised(next);
      await updateOwnState({ hand: next });
      notify(next ? "Hand raised." : "Hand lowered.");
      return;
    }

    addFloating(reaction.icon);
    await meetingRoomService.sendChat(profile, reaction.message, "everyone", null);
    notify(`Reaction sent: ${reaction.message}`);
    await refreshRoomState();
  }

  function appendEmoji(emoji: string) {
    setChatInput((current) => `${current}${current ? " " : ""}${emoji}`);
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text) return notify("Write a message first.");
    if (chatMode === "closed" && !canHost) return notify("Chat is closed by host.");
    if (chatMode === "admin" && !canHost && chatScope === "everyone") return notify("Public chat is host/admin-only right now.");

    await meetingRoomService.sendChat(profile, text, chatScope === "hosts" ? "hosts" : chatScope === "direct" ? "direct" : "everyone", directTargetId || null);
    setChatInput("");
    notify("Message sent.");
    await refreshRoomState();
  }

  function sendChatWithKeyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  }

  async function leaveOnly() {
    const myId = roomParticipantId(meetingRoomService.meetingId, profile?.id);
    await meetingRoomService.updateParticipant(myId, { status: "left", mic_on: false, camera_on: false });
    setLeaveDialogOpen(false);
    setRoute("memberHome");
  }

  async function endMeetingForEveryone() {
    if (!canEnd) return notify("Only host roles can end the meeting for everyone.");
    setLeaveDialogOpen(false);
    sendLiveKitControl("leave");
    await meetingRoomService.endMeetingForEveryone();
    demoStore.setMeetingState({ mic: false, camera: false, recording: false });
    notify("Meeting ended for everyone.");
    setRoute("memberHome");
  }

  const visibleTabs = [
    { key: "attendees", label: "All", show: true },
    { key: "waiting", label: "Waiting", show: canWaiting },
    { key: "chat", label: "Chat", show: true },
    { key: "reactions", label: "React", show: true },
    { key: "rooms", label: "Rooms", show: canHost }
  ] as const;

  const panelTitle = panel === "rooms" ? "Breakout rooms" : panel === "chat" ? `Chat (${chatMessages.length})` : panel === "reactions" ? "Reactions" : panel === "waiting" ? `Waiting Room (${waitingParticipants.length})` : "Attendees";

  return (
    <div className={`live-shell refined-live control-live polished-live rebuilt-live grid-${gridSize}`}>
      <header className="live-topbar">
        <div>
          <strong>OmideNo7 Main Room</strong>
          <span>Secure internal app meeting UI · {meetingRoomService.isReady() ? "realtime" : "local"}</span>
        </div>
        <div className="live-status-line">
          <span className={state.mic ? "ok" : ""}>{state.mic ? "Mic on" : "Muted"}</span>
          <span className={state.camera ? "ok" : ""}>{state.camera ? "Camera on" : "Camera off"}</span>
          {canWaiting && <span className={waitingParticipants.length ? "waiting-top-badge" : ""} onClick={() => { setSidebarOpen(true); setPanel("waiting"); }}>Waiting {waitingParticipants.length}</span>}
        </div>
        <div className="live-topbar-actions">
          {canMicControl && <button className={state.lectureMode ? "danger" : ""} onClick={() => toggle("lectureMode", "Lecture Mode enabled.", "Lecture Mode disabled.")}>Lecture</button>}
          {canHost && <button onClick={() => toggle("lowBandwidth", "Low Bandwidth Mode enabled.", "Low Bandwidth Mode disabled.")}>Low BW</button>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "Hide panel" : "Show panel"}</button>
        </div>
      </header>

      <main className={sidebarOpen ? "live-main side-open" : "live-main side-closed"}>
        <section className="participants-grid with-panel">
          <RealLiveKitRoom
            profile={profile}
            meetingId="main-room"
            admitted={canHost || myRoomStatus === "online"}
            autoStart={true}
            confirmBeforeStart={canHost}
            onConnectionChange={async (connected) => {
              setLiveKitConnected(connected);
              if (connected && canHost) {
                await meetingRoomService.openMeetingForEveryone();
              }
            }}
            onMediaStateChange={handleLiveKitMediaState}
          />
          {!liveKitConnected && participants.map((person) => (
            <article key={person.id} className={`participant-tile ${person.id === roomParticipantId(meetingRoomService.meetingId, profile?.id) ? "speaking" : ""}`}>
              <button className="participant-click-zone" onClick={() => { setSidebarOpen(true); setPanel("attendees"); if (person.id !== roomParticipantId(meetingRoomService.meetingId, profile?.id)) setSelectedAttendee(person); }}>
                <div className="participant-avatar clean-avatar">
                  {person.avatarUrl ? <img src={person.avatarUrl} alt={person.name} /> : person.camera ? <span className="camera-placeholder">Camera on</span> : <span>{person.symbol}</span>}
                </div>
                <strong>{person.name} {person.handRaised ? <em className="id-reaction">✋</em> : null}</strong>
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
              <strong>{panelTitle}</strong>
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
              </div>
            )}

            {controlMenu === "chat" && canHost && (
              <div className="host-control-dropdown">
                <button onClick={async () => { setChatMode("public"); await meetingRoomService.updateSettings({ chat_mode: "public" }); notify("Members can send public chat messages."); }}>Public chat</button>
                <button onClick={async () => { setChatMode("admin"); await meetingRoomService.updateSettings({ chat_mode: "admin" }); notify("Only hosts/admins can send public chat."); }}>Admin-only chat</button>
                <button onClick={async () => { setChatMode("closed"); await meetingRoomService.updateSettings({ chat_mode: "closed" }); notify("Members cannot send chat messages."); }}>Close chat sending</button>
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
                  {waitingParticipants.length === 0 ? <p className="empty-chat">No one is waiting now.</p> : waitingParticipants.map((person) => (
                    <article key={person.id} className="waiting-live-card visible-waiting-card">
                      <strong>{person.name}</strong>
                      <span>{person.role}</span>
                      <small>ID: {person.id}</small>
                      <div className="button-row compact-row">
                        <button onClick={() => admitWaitingPerson(person)}>Admit</button>
                        <button onClick={() => rejectWaitingPerson(person)}>Reject</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {panel === "attendees" && (
                <div className="attendee-list">
                  <input placeholder="Search participants" />
                  {participants.map((person) => (
                    <div className="attendee-row attendee-line" key={`${person.id}-row`}>
                      <button className="attendee-main-button" onClick={() => person.id !== roomParticipantId(meetingRoomService.meetingId, profile?.id) ? setSelectedAttendee(person) : notify("You selected yourself.")}>
                        <span className="attendee-mini-avatar">{person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : person.symbol}</span>
                        <span>{person.name} {person.handRaised ? "✋" : ""}</span>
                        <small>{person.role} · {person.room}</small>
                      </button>
                      {canMicControl && person.id !== roomParticipantId(meetingRoomService.meetingId, profile?.id) && (
                        <button className={`speaker-toggle ${person.mic ? "on" : ""}`} onClick={() => toggleParticipantMic(person)}>
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
                      <button onClick={() => { setPanel("chat"); setChatScope("direct"); setDirectTargetId(selectedAttendee.id); }}>Message</button>
                      {canHost && <button onClick={() => moveParticipant(selectedAttendee, "Prayer Room")}>Move to Prayer Room</button>}
                      {canHost && <button onClick={() => moveParticipant(selectedAttendee, "Main Room")}>Move to Main Room</button>}
                      {canMicControl && <button onClick={() => toggleParticipantMic(selectedAttendee)}>{selectedAttendee.mic ? "Mute microphone" : "Allow / unmute microphone"}</button>}
                      {canHost && <button className="danger" onClick={() => removeParticipant(selectedAttendee)}>Kick / remove from meeting</button>}
                    </div>
                  )}
                </div>
              )}

              {panel === "rooms" && <div className="rooms-panel">{["Main Room", "Prayer Room", "Bible Class Room", "Leadership Room"].map((room) => <div className="room-card" key={room}><strong>{room}</strong><span>{participants.filter((person) => person.room === room).length} participant(s)</span></div>)}</div>}

              {panel === "chat" && (
                <div className="chat-panel rebuilt-chat-panel">
                  <div className="chat-rules"><span>{chatMode === "closed" ? "Chat closed for members" : chatMode === "admin" ? "Host/Admin-only public chat" : "Chat open"}</span></div>
                  <div className="chat-messages rebuilt-chat-messages">
                    {chatMessages.length === 0 ? <p className="empty-chat">No messages yet.</p> : chatMessages.map((msg) => (
                      <article key={msg.id} className={msg.private ? "private-message compact-message" : "compact-message"}>
                        <div className="compact-message-head"><strong>{msg.from}</strong><small>{msg.to} · {msg.time}</small></div>
                        <p>{msg.text}</p>
                      </article>
                    ))}
                  </div>
                  <div className="chat-compose rebuilt-chat-compose">
                    <select value={chatScope} onChange={(event) => setChatScope(event.target.value as typeof chatScope)}>
                      <option value="everyone">Everyone</option>
                      <option value="hosts">Hosts/Admins only</option>
                      <option value="direct">Direct message</option>
                    </select>
                    <div className="chat-emoji-row main-chat-emoji-row">{chatEmojiOptions.map((emoji) => <button key={emoji} type="button" onClick={() => appendEmoji(emoji)}>{emoji}</button>)}</div>
                    <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={sendChatWithKeyboard} placeholder="Write a message..." />
                    <button onClick={sendChat}>Send message</button>
                  </div>
                </div>
              )}

              {panel === "reactions" && <div className="reactions-panel">{reactionOptions.map((reaction) => <button key={reaction.label} onClick={() => sendReaction(reaction.label)}><span>{reaction.icon}</span><strong>{reaction.label}</strong></button>)}</div>}
            </div>
          </aside>
        )}
      </main>

      <footer className="live-toolbar clean-toolbar">
        <ToolbarButton icon={state.mic ? "🎙" : "🔇"} label={state.mic ? "Mute" : "Unmute"} active={state.mic} onClick={() => liveKitConnected ? sendLiveKitControl("mic") : toggle("mic", "Microphone unmuted.", "Microphone muted.")} />
        <ToolbarButton icon={state.camera ? "📷" : "🚫"} label={state.camera ? "Video on" : "Video off"} active={state.camera} onClick={() => liveKitConnected ? sendLiveKitControl("camera") : toggle("camera", "Camera preview placeholder enabled.", "Camera turned off.")} />
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
