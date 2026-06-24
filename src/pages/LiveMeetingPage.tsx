import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useAppState } from "../app/AppState";
import {
  canEndWholeMeeting,
  canManageWaitingRoom,
  isHostLike,
  roleLabel
} from "../services/roleAccess";
import {
  meetingRoomService,
  roomParticipantId,
  type RoomChatMessage,
  type RoomParticipant
} from "../services/meetingRoomService";
import { RealLiveKitRoom } from "../components/livekit/RealLiveKitRoom";

type SidePanel = "closed" | "chat" | "waiting" | "attendees";

function toTime(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return "";
  }
}

function WaitingGate({
  status,
  onEnterWaiting,
  onRefresh,
  onBack
}: {
  status: string;
  onEnterWaiting: () => void;
  onRefresh: () => void;
  onBack: () => void;
}) {
  return (
    <div className="live-clean-page waiting-only">
      <section className="waiting-only-card">
        <h1>Waiting Room</h1>
        <p>You must wait for a host to admit you before entering the main meeting.</p>
        <strong>
          {status === "online"
            ? "You are admitted. Opening meeting..."
            : status === "waiting"
              ? "Waiting for host approval..."
              : "You are not in the waiting room yet."}
        </strong>
        <div className="clean-button-row">
          <button onClick={onEnterWaiting}>Enter Waiting Room</button>
          <button className="ghost" onClick={onRefresh}>Refresh</button>
          <button className="ghost" onClick={onBack}>Back Home</button>
        </div>
      </section>
    </div>
  );
}

function LiveMeetingStyles() {
  return (
    <style>{`
      .live-clean-page {
        width: 100%;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f7fbff 0%, #edf7f3 48%, #ffffff 100%);
        color: #06146d;
        box-sizing: border-box;
      }

      .waiting-only {
        align-items: center;
        justify-content: center;
        padding: 18px;
      }

      .waiting-only-card {
        width: min(560px, 100%);
        border-radius: 28px;
        padding: 28px;
        background: #fff;
        box-shadow: 0 22px 70px rgba(6, 20, 109, .16);
        border: 1px solid rgba(6, 20, 109, .08);
      }

      .waiting-only-card h1 {
        margin: 0 0 8px;
        color: #06146d;
      }

      .waiting-only-card p {
        color: #4b5563;
      }

      .waiting-only-card strong {
        display: block;
        margin: 14px 0;
        color: #0b5798;
      }

      .clean-live-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        background: rgba(255,255,255,.86);
        border-bottom: 1px solid rgba(6, 20, 109, .08);
        backdrop-filter: blur(14px);
        position: sticky;
        top: 0;
        z-index: 50;
      }

      .clean-live-brand {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .clean-live-brand strong {
        font-size: 1rem;
        color: #06146d;
      }

      .clean-live-brand span {
        font-size: .75rem;
        color: #64748b;
      }

      .clean-live-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }

      .clean-live-actions button,
      .clean-button-row button,
      .clean-toolbar button,
      .clean-panel button,
      .chat-send-button {
        border: 0;
        border-radius: 999px;
        padding: 9px 13px;
        background: #0b5798;
        color: #fff;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(11, 87, 152, .16);
      }

      .clean-live-actions button.green,
      .clean-button-row button.green {
        background: #13bf54;
      }

      .clean-live-actions button.danger,
      .clean-button-row button.danger,
      .clean-toolbar button.danger {
        background: #ef4444;
      }

      .clean-live-actions button.ghost,
      .clean-button-row button.ghost,
      .clean-panel button.ghost {
        background: rgba(6, 20, 109, .08);
        color: #06146d;
        box-shadow: none;
      }

      .clean-live-main {
        flex: 1 1 auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0;
        width: 100%;
        min-width: 0;
        padding: 10px;
        box-sizing: border-box;
        overflow: hidden;
      }

      .clean-live-main.panel-open {
        grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
        gap: 10px;
      }

      .clean-stage {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        height: calc(100dvh - 156px);
        min-height: 480px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 28px;
        box-sizing: border-box;
        background: linear-gradient(135deg, #06146d, #0b5798);
        box-shadow: 0 24px 70px rgba(6, 20, 109, .16);
      }

      .clean-stage > * {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        flex: 1 1 auto !important;
      }

      .clean-panel {
        height: calc(100dvh - 156px);
        min-height: 480px;
        overflow: hidden;
        border-radius: 28px;
        background: #fff;
        border: 1px solid rgba(6, 20, 109, .08);
        box-shadow: 0 24px 70px rgba(6, 20, 109, .12);
        display: flex;
        flex-direction: column;
      }

      .clean-panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(6, 20, 109, .08);
      }

      .clean-panel-head strong {
        color: #06146d;
      }

      .clean-panel-tabs {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        padding: 10px;
      }

      .clean-panel-tabs button {
        box-shadow: none;
        background: rgba(6, 20, 109, .07);
        color: #06146d;
        padding: 8px;
        border-radius: 14px;
      }

      .clean-panel-tabs button.active {
        background: #0b5798;
        color: #fff;
      }

      .clean-panel-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 10px;
      }

      .clean-chat-messages {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 240px;
      }

      .clean-message {
        border-radius: 16px;
        padding: 9px 10px;
        background: rgba(6, 20, 109, .06);
      }

      .clean-message strong {
        color: #06146d;
        font-size: .82rem;
      }

      .clean-message small {
        color: #64748b;
        font-size: .68rem;
        margin-left: 6px;
      }

      .clean-message p {
        margin: 5px 0 0;
        font-size: .84rem;
        color: #1f2937;
      }

      .clean-chat-compose {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 10px;
        border-top: 1px solid rgba(6, 20, 109, .08);
        padding-top: 10px;
      }

      .clean-chat-compose textarea {
        min-height: 82px;
        border-radius: 16px;
        border: 1px solid rgba(6, 20, 109, .12);
        padding: 10px;
        resize: vertical;
        font: inherit;
      }

      .clean-emoji-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .clean-emoji-row button {
        box-shadow: none;
        background: rgba(6, 20, 109, .07);
        color: #06146d;
        padding: 7px 9px;
      }

      .clean-person-card {
        border-radius: 18px;
        padding: 10px;
        background: rgba(6, 20, 109, .05);
        margin-bottom: 8px;
      }

      .clean-person-card strong {
        color: #06146d;
      }

      .clean-person-card span,
      .clean-person-card small {
        display: block;
        color: #64748b;
        font-size: .75rem;
      }

      .clean-toolbar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 9px 12px 12px;
        background: rgba(255,255,255,.9);
        border-top: 1px solid rgba(6, 20, 109, .08);
        flex-wrap: wrap;
      }

      .clean-toolbar button {
        min-width: 82px;
      }

      .live-toast-clean {
        position: fixed;
        left: 50%;
        bottom: 78px;
        transform: translateX(-50%);
        background: rgba(2,6,23,.88);
        color: #fff;
        border-radius: 999px;
        padding: 8px 13px;
        z-index: 100;
        font-size: .82rem;
        font-weight: 800;
      }

      .clean-button-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }

      @media (max-width: 900px) {
        .clean-live-topbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .clean-live-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .clean-live-main,
        .clean-live-main.panel-open {
          display: flex;
          flex-direction: column;
          padding: 8px;
          gap: 8px;
        }

        .clean-stage {
          height: 58dvh;
          min-height: 390px;
          border-radius: 22px;
        }

        .clean-panel {
          height: 42dvh;
          min-height: 300px;
          border-radius: 22px;
        }

        .clean-toolbar {
          justify-content: flex-start;
          overflow-x: auto;
          flex-wrap: nowrap;
        }

        .clean-toolbar button {
          min-width: 90px;
          white-space: nowrap;
        }
      }

      @media (max-width: 520px) {
        .clean-stage {
          height: 54dvh;
          min-height: 340px;
        }

        .clean-panel {
          height: 44dvh;
        }
      }
    `}</style>
  );
}

export function LiveMeetingPage() {
  const { profile, setRoute } = useAppState();

  const canHost = isHostLike(profile);
  const canWaiting = canManageWaitingRoom(profile);
  const canEnd = canEndWholeMeeting(profile);

  const [panel, setPanel] = useState<SidePanel>("closed");
  const [toast, setToast] = useState("Ready");
  const [myStatus, setMyStatus] = useState<"unknown" | "waiting" | "online" | "removed" | "blocked" | "left">("unknown");
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [waiting, setWaiting] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [liveKitConnected, setLiveKitConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [roomIsOpen, setRoomIsOpen] = useState(false);

  const panelTitle = useMemo(() => {
    if (panel === "chat") return `Chat (${messages.length})`;
    if (panel === "waiting") return `Waiting Room (${waiting.length})`;
    if (panel === "attendees") return `Attendees (${participants.length})`;
    return "Panel";
  }, [panel, messages.length, waiting.length, participants.length]);

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast("Ready"), 2800);
  }

  async function refreshRoom() {
    const [rows, chatRows, myRow, settings] = await Promise.all([
      meetingRoomService.listParticipants(),
      meetingRoomService.listChat(),
      meetingRoomService.getMyRow(profile),
      meetingRoomService.getSettings()
    ]);

    setRoomIsOpen(Boolean(settings?.live_open));
    setParticipants(rows.filter((row) => row.status === "online"));
    setWaiting(rows.filter((row) => row.status === "waiting"));
    setMessages(chatRows);

    if (canHost) {
      setMyStatus("online");
      return;
    }

    if (!myRow) {
      setMyStatus("unknown");
      return;
    }

    if (myRow.status === "removed" || myRow.status === "blocked") {
      setMyStatus(myRow.status);
      setRoute("memberHome");
      return;
    }

    setMyStatus(myRow.status);
  }

  useEffect(() => {
    let alive = true;

    async function boot() {
      if (!alive) return;

      if (canHost) {
        await meetingRoomService.enterOnline(profile, {
          mic_on: false,
          camera_on: false,
          display_name: profile?.displayName || "Host",
          role_label: roleLabel(profile?.role),
          avatar_url: profile?.avatarUrl || null,
          allowed_mic: true
        });
      }

      await refreshRoom();
    }

    void boot();
    const unsubscribe = meetingRoomService.subscribe(() => void refreshRoom());
    const timer = window.setInterval(() => void refreshRoom(), 2500);

    return () => {
      alive = false;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [profile?.id, profile?.avatarUrl, canHost]);

  async function enterWaitingRoom() {
    await meetingRoomService.joinWaiting(profile);
    await meetingRoomService.raiseAlert(`${profile?.displayName || "A member"} is waiting for admission.`, "waiting_room", "red", "active");
    setMyStatus("waiting");
    notify("You entered the waiting room.");
    await refreshRoom();
  }

  async function admitPerson(person: RoomParticipant) {
    if (!canWaiting) return notify("Only hosts can admit members.");
    await meetingRoomService.admitParticipant(person.id);
    notify(`${person.display_name} admitted.`);
    await refreshRoom();
  }

  async function rejectPerson(person: RoomParticipant) {
    if (!canWaiting) return notify("Only hosts can reject members.");
    await meetingRoomService.rejectParticipant(person.id);
    notify(`${person.display_name} rejected.`);
    await refreshRoom();
  }

  async function removePerson(person: RoomParticipant) {
    if (!canHost) return notify("Only hosts can remove members.");
    await meetingRoomService.removeParticipant(person.id);
    notify(`${person.display_name} removed.`);
    await refreshRoom();
  }

  async function startHostRoom() {
    if (!canHost) return;
    await meetingRoomService.openMeetingForEveryone();
    setRoomIsOpen(true);
    notify("Live room opened.");
  }

  async function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;
    await meetingRoomService.sendChat(profile, text, "everyone", null);
    setChatInput("");
    notify("Message sent.");
    await refreshRoom();
  }

  function sendWithKeyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function sendLiveKitControl(action: "mic" | "camera" | "leave" | "force-disconnect") {
    window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action } }));
  }

  async function handleMediaState(next: { mic: boolean; camera: boolean }) {
    setMicOn(next.mic);
    setCameraOn(next.camera);

    await meetingRoomService.enterOnline(profile, {
      mic_on: next.mic,
      camera_on: next.camera,
      display_name: profile?.displayName || "User",
      role_label: roleLabel(profile?.role),
      avatar_url: profile?.avatarUrl || null,
      allowed_mic: true
    });

    await refreshRoom();
  }

  async function leaveOnly() {
    sendLiveKitControl("force-disconnect");
    await meetingRoomService.leaveMeeting(profile);
    setLiveKitConnected(false);
    setMicOn(false);
    setCameraOn(false);
    setRoute(canHost ? "ownerDashboard" : "memberHome");
  }

  async function endForEveryone() {
    if (!canEnd) return notify("Only host roles can end the meeting.");
    sendLiveKitControl("force-disconnect");
    await meetingRoomService.endMeetingForEveryone();
    setLiveKitConnected(false);
    setMicOn(false);
    setCameraOn(false);
    setRoomIsOpen(false);
    notify("Meeting ended and chat cleared.");
    setRoute(canHost ? "ownerDashboard" : "memberHome");
  }

  const memberBlocked = !canHost && myStatus !== "online";

  if (memberBlocked) {
    return (
      <>
        <LiveMeetingStyles />
        <WaitingGate
          status={myStatus}
          onEnterWaiting={enterWaitingRoom}
          onRefresh={refreshRoom}
          onBack={() => setRoute("memberHome")}
        />
      </>
    );
  }

  return (
    <div className="live-clean-page">
      <LiveMeetingStyles />

      <header className="clean-live-topbar">
        <div className="clean-live-brand">
          <strong>OmideNo7 Main Room</strong>
          <span>
            {canHost ? "Host control" : "Member room"} · {meetingRoomService.isReady() ? "Supabase realtime" : "Local mode"} · {liveKitConnected ? "LiveKit connected" : "LiveKit ready"}
          </span>
        </div>

        <div className="clean-live-actions">
          {canHost && !roomIsOpen && (
            <button className="green" onClick={startHostRoom}>
              Open meeting
            </button>
          )}

          {canWaiting && (
            <button className={waiting.length ? "green" : "ghost"} onClick={() => setPanel(panel === "waiting" ? "closed" : "waiting")}>
              Waiting {waiting.length}
            </button>
          )}

          <button className="ghost" onClick={() => setPanel(panel === "chat" ? "closed" : "chat")}>
            Chat
          </button>

          <button className="ghost" onClick={() => setPanel(panel === "attendees" ? "closed" : "attendees")}>
            Attendees
          </button>
        </div>
      </header>

      <main className={panel === "closed" ? "clean-live-main" : "clean-live-main panel-open"}>
        <section className="clean-stage">
          <RealLiveKitRoom
            profile={profile}
            meetingId="main-room"
            admitted={canHost || myStatus === "online"}
            autoStart={!canHost}
            confirmBeforeStart={canHost}
            onConnectionChange={async (connected) => {
              setLiveKitConnected(connected);
              if (connected && canHost) {
                await meetingRoomService.openMeetingForEveryone();
                setRoomIsOpen(true);
              }
            }}
            onMediaStateChange={handleMediaState}
            onLeave={async () => {
              await meetingRoomService.leaveMeeting(profile);
              await refreshRoom();
            }}
          />
        </section>

        {panel !== "closed" && (
          <aside className="clean-panel">
            <div className="clean-panel-head">
              <strong>{panelTitle}</strong>
              <button className="ghost" onClick={() => setPanel("closed")}>×</button>
            </div>

            <div className="clean-panel-tabs">
              <button className={panel === "chat" ? "active" : ""} onClick={() => setPanel("chat")}>Chat</button>
              <button className={panel === "attendees" ? "active" : ""} onClick={() => setPanel("attendees")}>Attendees</button>
              <button className={panel === "waiting" ? "active" : ""} onClick={() => setPanel("waiting")} disabled={!canWaiting}>Waiting</button>
            </div>

            <div className="clean-panel-body">
              {panel === "chat" && (
                <>
                  <div className="clean-chat-messages">
                    {messages.length === 0 ? (
                      <p>No messages yet.</p>
                    ) : (
                      messages.map((message) => (
                        <article className="clean-message" key={message.id}>
                          <strong>{message.sender_name}</strong>
                          <small>{toTime(message.created_at)}</small>
                          <p>{message.message}</p>
                        </article>
                      ))
                    )}
                  </div>

                  <div className="clean-chat-compose">
                    <div className="clean-emoji-row">
                      {["Amen", "❤️", "👍", "🙏", "✝️", "🙌"].map((emoji) => (
                        <button key={emoji} type="button" onClick={() => setChatInput((current) => `${current}${current ? " " : ""}${emoji}`)}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={sendWithKeyboard}
                      placeholder="Write a message..."
                    />
                    <button className="chat-send-button" onClick={sendMessage}>Send message</button>
                  </div>
                </>
              )}

              {panel === "attendees" && (
                <div>
                  {participants.length === 0 ? (
                    <p>No one is online yet.</p>
                  ) : (
                    participants.map((person) => (
                      <article className="clean-person-card" key={person.id}>
                        <strong>{person.display_name}</strong>
                        <span>{person.role_label} · {person.room_name}</span>
                        <small>{person.mic_on ? "Mic on" : "Muted"} · {person.camera_on ? "Camera on" : "Camera off"}</small>
                        {canHost && person.id !== roomParticipantId(meetingRoomService.meetingId, profile?.id) && (
                          <div className="clean-button-row">
                            <button className="danger" onClick={() => removePerson(person)}>Remove</button>
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>
              )}

              {panel === "waiting" && canWaiting && (
                <div>
                  {waiting.length === 0 ? (
                    <p>No one is waiting now.</p>
                  ) : (
                    waiting.map((person) => (
                      <article className="clean-person-card" key={person.id}>
                        <strong>{person.display_name}</strong>
                        <span>{person.role_label}</span>
                        <small>{person.id}</small>
                        <div className="clean-button-row">
                          <button className="green" onClick={() => admitPerson(person)}>Admit</button>
                          <button className="danger" onClick={() => rejectPerson(person)}>Reject</button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </main>

      <footer className="clean-toolbar">
        <button onClick={() => liveKitConnected ? sendLiveKitControl("mic") : notify("Enter live room first.")}>
          {micOn ? "Mute" : "Unmute"}
        </button>
        <button onClick={() => liveKitConnected ? sendLiveKitControl("camera") : notify("Enter live room first.")}>
          {cameraOn ? "Camera off" : "Camera on"}
        </button>
        <button onClick={() => setPanel(panel === "chat" ? "closed" : "chat")}>Chat</button>
        <button onClick={() => setPanel(panel === "attendees" ? "closed" : "attendees")}>People</button>
        <button className="danger" onClick={leaveOnly}>Leave</button>
        {canEnd && <button className="danger" onClick={endForEveryone}>End all</button>}
      </footer>

      <div className="live-toast-clean">{toast}</div>
    </div>
  );
}
