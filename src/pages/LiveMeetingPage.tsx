import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useAppState } from "../app/AppState";
import {
  canControlMicrophones,
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
type ChatTarget = "everyone" | "hosts" | string;

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
        <h1>Request to Join Meeting</h1>
        <p>Send a request to the host. After approval, the live meeting will open for you.</p>
        <strong>
          {status === "online"
            ? "You are admitted. Opening meeting..."
            : status === "waiting"
              ? "Waiting for host approval..."
              : "You have not requested to join yet."}
        </strong>
        <div className="clean-button-row">
          <button onClick={onEnterWaiting}>Request to Join Meeting</button>
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
        position: relative;
      }

      .live-reaction-layer {
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: 25;
        overflow: hidden;
      }

      .live-floating-reaction {
        position: absolute;
        left: var(--x, 50%);
        bottom: 72px;
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: max-content;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,.92);
        color: #06146d;
        font-weight: 950;
        box-shadow: 0 16px 36px rgba(0,0,0,.20);
        animation: reaction-rise 3.8s ease-out forwards;
      }

      .live-floating-reaction b {
        font-size: 1.4rem;
        line-height: 1;
      }

      .live-floating-reaction span {
        font-size: .72rem;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @keyframes reaction-rise {
        0% { transform: translate(-50%, 30px) scale(.88); opacity: 0; }
        10% { opacity: 1; }
        72% { opacity: .96; }
        100% { transform: translate(-50%, -78vh) scale(1.26); opacity: 0; }
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

      .clean-chat-mode-control {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        margin-bottom: 10px;
        padding: 8px;
        border-radius: 16px;
        background: rgba(6, 20, 109, .05);
      }

      .clean-chat-mode-control button {
        box-shadow: none;
        padding: 7px 8px;
        background: rgba(6, 20, 109, .08);
        color: #06146d;
        border-radius: 12px;
      }

      .clean-chat-mode-control button.active {
        background: #13bf54;
        color: #fff;
      }

      .clean-chat-note {
        border-radius: 14px;
        padding: 8px 10px;
        margin: 0 0 10px;
        background: rgba(239, 68, 68, .10);
        color: #7f1d1d;
        font-weight: 800;
        font-size: .8rem;
      }

      .top-chat-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px;
        border-radius: 999px;
        background: rgba(6, 20, 109, .07);
      }

      .top-chat-controls button {
        box-shadow: none;
        padding: 7px 10px;
        background: transparent;
        color: #06146d;
      }

      .top-chat-controls button.active {
        background: #ef4444;
        color: #fff;
      }

      .waiting-danger-badge {
        background: #ef4444 !important;
        color: #fff !important;
        animation: waiting-red-pulse 1.1s ease-in-out infinite;
      }

      @keyframes waiting-red-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,.28); }
        50% { box-shadow: 0 0 0 8px rgba(239,68,68,.06); }
      }

      .live-toast-clean.alert-red {
        background: #ef4444 !important;
        color: #fff !important;
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

      .person-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .person-title {
        min-width: 0;
      }

      .attendee-compact-row {
        padding: 8px 9px;
        border-radius: 15px;
        background: rgba(6, 20, 109, .045);
      }

      .attendee-compact-title strong {
        display: block;
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .attendee-status-line {
        margin-top: 3px;
        font-size: .68rem !important;
      }

      .attendee-actions {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .attendee-icon-btn {
        width: 34px;
        height: 34px;
        padding: 0 !important;
        display: grid;
        place-items: center;
        border-radius: 999px !important;
        box-shadow: none !important;
        background: rgba(6, 20, 109, .09) !important;
        color: #06146d !important;
        font-size: 1rem;
      }

      .attendee-icon-btn.mic-locked {
        background: rgba(239, 68, 68, .14) !important;
        color: #991b1b !important;
      }

      .attendee-menu {
        margin-top: 8px;
        display: grid;
        gap: 6px;
        padding: 8px;
        border-radius: 14px;
        background: #fff;
        border: 1px solid rgba(6,20,109,.10);
        box-shadow: 0 14px 36px rgba(6,20,109,.12);
      }

      .attendee-menu button {
        width: 100%;
        text-align: left;
        border-radius: 12px !important;
        box-shadow: none !important;
      }

      .toolbar-react-wrap {
        position: relative;
        display: inline-flex;
      }

      .reaction-picker {
        position: fixed;
        left: 50%;
        bottom: 86px;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        gap: 7px;
        padding: 9px;
        border-radius: 999px;
        background: #ffffff;
        box-shadow: 0 24px 60px rgba(6,20,109,.28);
        border: 1px solid rgba(6,20,109,.10);
      }

      .reaction-picker button {
        min-width: 38px !important;
        width: 38px;
        height: 38px;
        padding: 0 !important;
        display: grid;
        place-items: center;
        font-size: 1.05rem;
        box-shadow: none !important;
        background: rgba(6, 20, 109, .08) !important;
        color: #06146d !important;
      }

      .recording-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 35;
        padding: 8px 12px;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        font-weight: 950;
        box-shadow: 0 16px 36px rgba(239,68,68,.28);
        animation: waiting-red-pulse 1.1s ease-in-out infinite;
      }

      .recording-helper {
        position: absolute;
        top: 54px;
        right: 12px;
        z-index: 35;
        max-width: min(420px, calc(100% - 24px));
        padding: 8px 10px;
        border-radius: 14px;
        background: rgba(255,255,255,.92);
        color: #7f1d1d;
        font-weight: 800;
        font-size: .72rem;
        box-shadow: 0 12px 28px rgba(0,0,0,.16);
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


const reactionOptions = [
  { key: "heart", emoji: "❤️", label: "Heart" },
  { key: "like", emoji: "👍", label: "Like" },
  { key: "amen", emoji: "Amen", label: "Amen" },
  { key: "hallelujah", emoji: "🙌", label: "Hallelujah" },
  { key: "cake", emoji: "🎂", label: "Birthday" }
] as const;

type FloatingReaction = {
  id: string;
  emoji: string;
  label: string;
  sender: string;
  x: number;
};

function encodeReaction(key: string, emoji: string, sender: string) {
  return `__reaction__:${key}:${emoji}:${sender}`;
}

function parseReaction(message: string) {
  if (!message.startsWith("__reaction__:")) return null;
  const [, key = "reaction", emoji = "❤️", ...senderParts] = message.split(":");
  const sender = senderParts.join(":") || "Member";
  const option = reactionOptions.find((item) => item.key === key);
  return {
    key,
    emoji: option?.emoji || emoji,
    label: option?.label || key,
    sender
  };
}

const meetingHostRoles = new Set([
  "owner",
  "senior_host",
  "meeting_host",
  "co_host",
  "door_servant",
  "media_servant",
  "prayer_servant",
  "chat_moderator"
]);

const micControlRoles = new Set(["owner", "senior_host", "meeting_host", "co_host"]);
const waitingControlRoles = new Set(["owner", "senior_host", "meeting_host", "co_host", "door_servant"]);

function normalizeMeetingRole(value?: string | null) {
  return String(value || "approved_member").trim().toLowerCase().replaceAll(" ", "_");
}

function shortParticipantId(person: RoomParticipant) {
  return (person.profile_id || person.id || "").slice(0, 8);
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function LiveMeetingPage() {
  const { profile, setRoute } = useAppState();

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
  const [chatMode, setChatMode] = useState<"public" | "admin" | "closed">("public");
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [chatTarget, setChatTarget] = useState<ChatTarget>("everyone");
  const [openPersonMenu, setOpenPersonMenu] = useState<string | null>(null);
  const [myMeetingRole, setMyMeetingRole] = useState<string>("");
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recordingElapsed, setRecordingElapsed] = useState("00:00");
  const seenReactionIds = useRef<Set<string>>(new Set());
  const reactionsBooted = useRef(false);

  const effectiveRole = normalizeMeetingRole(myMeetingRole || profile?.role);
  const canHost = Boolean(profile?.status === "approved" && meetingHostRoles.has(effectiveRole));
  const canWaiting = Boolean(profile?.status === "approved" && waitingControlRoles.has(effectiveRole));
  const canEnd = Boolean(profile?.status === "approved" && micControlRoles.has(effectiveRole));
  const canMicControl = Boolean(profile?.status === "approved" && micControlRoles.has(effectiveRole));

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

  function pushFloatingReaction(emoji: string, label: string, sender: string) {
    const id = crypto.randomUUID();
    setFloatingReactions((current) => [
      ...current,
      { id, emoji, label, sender, x: 18 + Math.round(Math.random() * 64) }
    ]);
    window.setTimeout(() => {
      setFloatingReactions((current) => current.filter((item) => item.id !== id));
    }, 3400);
  }

  useEffect(() => {
    if (!recording || !recordingStartedAt) {
      setRecordingElapsed("00:00");
      return;
    }

    const update = () => {
      setRecordingElapsed(formatDuration(Math.floor((Date.now() - recordingStartedAt) / 1000)));
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [recording, recordingStartedAt]);

  function canSendChatNow() {
    if (chatMode === "public") return true;
    if (chatMode === "admin") return canHost;
    return false;
  }

  async function refreshRoom() {
    const [rows, chatRows, myRow, settings] = await Promise.all([
      meetingRoomService.listParticipants(),
      meetingRoomService.listChat(),
      meetingRoomService.getMyRow(profile),
      meetingRoomService.getSettings()
    ]);

    setRoomIsOpen(Boolean(settings?.live_open));
    setChatMode(settings?.chat_mode || "public");
    setParticipants(rows.filter((row) => row.status === "online"));
    setWaiting(rows.filter((row) => row.status === "waiting"));

    const visibleMessages: RoomChatMessage[] = [];
    const reactionRows: RoomChatMessage[] = [];

    for (const row of chatRows) {
      const reaction = parseReaction(row.message || "");
      if (reaction) {
        reactionRows.push(row);
        continue;
      }

      if (row.target_type === "everyone" || canHost || row.target_id === profile?.id) {
        visibleMessages.push(row);
      }
    }

    if (!reactionsBooted.current) {
      reactionRows.forEach((row) => seenReactionIds.current.add(row.id));
      reactionsBooted.current = true;
    } else {
      for (const row of reactionRows) {
        if (seenReactionIds.current.has(row.id)) continue;
        seenReactionIds.current.add(row.id);
        const reaction = parseReaction(row.message || "");
        if (reaction) pushFloatingReaction(reaction.emoji, reaction.label, reaction.sender);
      }
    }

    setMessages(visibleMessages);

    if (canHost) {
      setMyMeetingRole((rows.find((row) => row.profile_id === profile?.id)?.role_label) || roleLabel(profile?.role));
      setMyStatus("online");
      return;
    }

    if (!myRow) {
      setMyMeetingRole("");
      setMyStatus("unknown");
      return;
    }

    setMyMeetingRole(myRow.role_label || "");

    if (myRow.status === "removed" || myRow.status === "blocked") {
      setMyStatus(myRow.status);
      setRoute("memberHome");
      return;
    }

    setMyStatus(myRow.status);

    if (myRow.status === "online" && myRow.allowed_mic === false) {
      if (micOn) {
        window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action: "force-mic-off" } }));
        setMicOn(false);
      }
    }
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
        await meetingRoomService.openMeetingForEveryone();
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

  useEffect(() => {
    if (!profile?.id) return;

    function markLeftOnClose() {
      void meetingRoomService.leaveMeeting(profile);
      window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action: "force-disconnect" } }));
    }

    window.addEventListener("pagehide", markLeftOnClose);
    window.addEventListener("beforeunload", markLeftOnClose);

    return () => {
      window.removeEventListener("pagehide", markLeftOnClose);
      window.removeEventListener("beforeunload", markLeftOnClose);
    };
  }, [profile?.id]);

  async function enterWaitingRoom() {
    await meetingRoomService.joinWaiting(profile);
    await meetingRoomService.raiseAlert(`${profile?.displayName || "A member"} is waiting for admission.`, "waiting_room", "red", "active");
    setMyStatus("waiting");
    notify("Request sent. Waiting for host admission.");
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

  async function togglePersonMicPermission(person: RoomParticipant) {
    if (!canMicControl) return notify("Only host roles can control microphones.");
    const allow = person.allowed_mic === false;
    await meetingRoomService.setParticipantMicPermission(person.id, allow);
    notify(allow ? `${person.display_name} can unmute now. They must press Unmute themselves.` : `${person.display_name} microphone locked and will be muted automatically.`);
    await refreshRoom();
  }

  async function makeCoHost(person: RoomParticipant) {
    if (!canHost) return notify("Only host roles can change meeting roles.");
    await meetingRoomService.updateParticipantRole(person.id, "co_host");
    await meetingRoomService.updateProfileRole(person.profile_id, "co_host");
    notify(`${person.display_name} is now co-host.`);
    await refreshRoom();
  }

  async function makeMember(person: RoomParticipant) {
    if (!canHost) return notify("Only host roles can change meeting roles.");
    await meetingRoomService.updateParticipantRole(person.id, "approved_member");
    await meetingRoomService.updateProfileRole(person.profile_id, "approved_member");
    notify(`${person.display_name} is now member.`);
    await refreshRoom();
  }

  function startDirectMessage(person: RoomParticipant) {
    setPanel("chat");
    setChatTarget(person.profile_id || person.id);
    setChatInput(`@${person.display_name} `);
    notify(`Direct message to ${person.display_name}.`);
  }

  async function startHostRoom() {
    if (!canHost) return;
    await meetingRoomService.enterOnline(profile, {
      mic_on: false,
      camera_on: false,
      display_name: profile?.displayName || "Host",
      role_label: myMeetingRole || roleLabel(profile?.role),
      avatar_url: profile?.avatarUrl || null,
      allowed_mic: true
    });
    await meetingRoomService.openMeetingForEveryone();
    setRoomIsOpen(true);
    notify("Live room opened. Entering live now...");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action: "enter-live" } }));
    }, 150);
  }

  async function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;
    if (!canSendChatNow()) {
      notify(chatMode === "closed" ? "Chat is closed by the host." : "Chat is limited to servants and hosts.");
      return;
    }
    if (chatTarget === "hosts") {
      await meetingRoomService.sendChat(profile, text, "hosts", null);
    } else if (chatTarget !== "everyone") {
      await meetingRoomService.sendChat(profile, text, "direct", chatTarget);
    } else {
      await meetingRoomService.sendChat(profile, text, chatMode === "admin" ? "hosts" : "everyone", null);
    }
    setChatInput("");
    notify("Message sent.");
    await refreshRoom();
  }

  async function changeChatMode(mode: "public" | "admin" | "closed") {
    if (!canHost) return notify("Only host roles can control chat.");
    setChatMode(mode);
    const saved = await meetingRoomService.updateSettings({ chat_mode: mode });
    notify(mode === "public" ? "Chat is open for everyone." : mode === "admin" ? "Chat is limited to servants/hosts." : "Chat is closed for everyone.");
    if (!saved) notify("Chat mode did not save in Supabase. Run the v1.46 SQL patch.");
    window.setTimeout(() => void refreshRoom(), 650);
  }

  async function sendReaction(key: string, emoji: string, label: string) {
    const sender = profile?.displayName || "Member";
    pushFloatingReaction(emoji, label, sender);
    await meetingRoomService.sendChat(profile, encodeReaction(key, emoji, sender), "everyone", null);
  }

  async function toggleHandRaised() {
    if (!profile?.id) return;
    const myId = roomParticipantId(meetingRoomService.meetingId, profile.id);
    const myRow = participants.find((item) => item.id === myId) || await meetingRoomService.getMyRow(profile);
    const next = !Boolean(myRow?.hand_raised);
    await meetingRoomService.updateParticipant(myId, { hand_raised: next });
    notify(next ? "Hand raised." : "Hand lowered.");
    await refreshRoom();
  }

  function sendWithKeyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function toggleRecordingMarker() {
    if (!canHost) return notify("Only host roles can control recording.");
    const next = !recording;
    setRecording(next);
    setRecordingStartedAt(next ? Date.now() : null);
    notify(next ? "REC marker started. Real cloud recording still needs LiveKit Egress setup." : "REC marker stopped.");
  }

  function sendLiveKitControl(action: "enter-live" | "mic" | "camera" | "screen" | "leave" | "force-disconnect" | "force-mic-off") {
    window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action } }));
  }

  async function handleMediaState(next: { mic: boolean; camera: boolean }) {
    setMicOn(next.mic);
    setCameraOn(next.camera);

    const currentRow = await meetingRoomService.getMyRow(profile);
    await meetingRoomService.enterOnline(profile, {
      mic_on: next.mic,
      camera_on: next.camera,
      display_name: profile?.displayName || "User",
      role_label: myMeetingRole || roleLabel(profile?.role),
      avatar_url: profile?.avatarUrl || currentRow?.avatar_url || null,
      allowed_mic: true,
      hand_raised: Boolean(currentRow?.hand_raised)
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
              Open & enter live
            </button>
          )}

          {canHost && (
            <div className="top-chat-controls" title="Host chat control">
              <button className={chatMode === "public" ? "active" : ""} onClick={() => changeChatMode("public")}>Chat open</button>
              <button className={chatMode === "admin" ? "active" : ""} onClick={() => changeChatMode("admin")}>Servants</button>
              <button className={chatMode === "closed" ? "active" : ""} onClick={() => changeChatMode("closed")}>Closed</button>
            </div>
          )}

          {canWaiting && (
            <button className={waiting.length ? "waiting-danger-badge" : "ghost"} onClick={() => setPanel(panel === "waiting" ? "closed" : "waiting")}>
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
          {recording && <div className="recording-badge">● REC {recordingElapsed}</div>}
          {recording && <div className="recording-helper">Recording marker only. Real saved recordings require LiveKit Egress/storage setup.</div>}
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
            participants={participants}
            onLeave={async () => {
              await meetingRoomService.leaveMeeting(profile);
              await refreshRoom();
            }}
          />


          <div className="live-reaction-layer">
            {floatingReactions.map((reaction) => (
              <div
                key={reaction.id}
                className="live-floating-reaction"
                style={{ "--x": `${reaction.x}%` } as CSSProperties}
              >
                <b>{reaction.emoji}</b>
                <span>{reaction.sender}</span>
              </div>
            ))}
          </div>
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
              {canWaiting && <button className={panel === "waiting" ? "active" : ""} onClick={() => setPanel("waiting")}>Waiting</button>}
            </div>

            <div className="clean-panel-body">
              {panel === "chat" && (
                <>
                  {canHost && (
                    <div className="clean-chat-mode-control">
                      <button className={chatMode === "public" ? "active" : ""} onClick={() => changeChatMode("public")}>Open</button>
                      <button className={chatMode === "admin" ? "active" : ""} onClick={() => changeChatMode("admin")}>Servants</button>
                      <button className={chatMode === "closed" ? "active" : ""} onClick={() => changeChatMode("closed")}>Closed</button>
                    </div>
                  )}

                  {!canSendChatNow() && (
                    <p className="clean-chat-note">
                      {chatMode === "closed" ? "Chat is closed by the host." : "Chat is limited to servants and hosts."}
                    </p>
                  )}

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
                    {canHost && (
                      <label>
                        Send to
                        <select value={chatTarget} onChange={(event) => setChatTarget(event.target.value)}>
                          <option value="everyone">Everyone</option>
                          <option value="hosts">Hosts / servants</option>
                          {participants.filter((p) => p.profile_id).map((p) => (
                            <option key={p.id} value={p.profile_id || p.id}>{p.display_name}</option>
                          ))}
                        </select>
                      </label>
                    )}
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
                      placeholder={canSendChatNow() ? "Write a message..." : "Chat is not open for your role."}
                      disabled={!canSendChatNow()}
                    />
                    <button className="chat-send-button" onClick={sendMessage} disabled={!canSendChatNow()}>Send message</button>
                  </div>
                </>
              )}

              {panel === "attendees" && (
                <div>
                  {participants.length === 0 ? (
                    <p>No one is online yet.</p>
                  ) : (
                    participants.map((person) => {
                      const isMe = person.id === roomParticipantId(meetingRoomService.meetingId, profile?.id);
                      return (
                        <article className="clean-person-card attendee-compact-row" key={person.id}>
                          <div className="person-card-head attendee-compact-head">
                            <div className="person-title attendee-compact-title">
                              <strong>{person.hand_raised ? "✋ " : ""}{person.display_name}</strong>
                              <small>ID: {shortParticipantId(person)} · {person.role_label?.replaceAll("_", " ")}</small>
                            </div>
                            {canHost && !isMe && (
                              <div className="attendee-actions">
                                {canMicControl && (
                                  <button className={person.allowed_mic === false ? "attendee-icon-btn mic-locked" : "attendee-icon-btn"} title={person.allowed_mic === false ? "Allow this member to unmute" : "Mute and lock this member microphone"} onClick={() => togglePersonMicPermission(person)}>
                                    {person.allowed_mic === false ? "🔇" : person.mic_on ? "🎙️" : "🎤"}
                                  </button>
                                )}
                                <button className="attendee-icon-btn" title="Participant menu" onClick={() => setOpenPersonMenu(openPersonMenu === person.id ? null : person.id)}>⋯</button>
                              </div>
                            )}
                          </div>
                          <small className="attendee-status-line">{person.allowed_mic === false ? "Mic locked" : person.mic_on ? "Mic on" : "Muted"} · {person.camera_on ? "Camera on" : "Camera off"}</small>
                          {canHost && !isMe && openPersonMenu === person.id && (
                            <div className="attendee-menu">
                              <button onClick={() => makeCoHost(person)}>Make co-host</button>
                              <button onClick={() => makeMember(person)}>Change to member</button>
                              <button onClick={() => startDirectMessage(person)}>Direct message</button>
                              <button className="danger" onClick={() => removePerson(person)}>Remove from meeting</button>
                            </div>
                          )}
                        </article>
                      );
                    })
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
                        <strong>{person.hand_raised ? "✋ " : ""}{person.display_name}</strong>
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
        <button onClick={() => liveKitConnected ? sendLiveKitControl("screen") : notify("Enter live room first.")}>
          Share screen
        </button>
        {canHost && (
          <button className={recording ? "danger" : ""} onClick={toggleRecordingMarker}>
            {recording ? "REC on" : "Record"}
          </button>
        )}
        <div className="toolbar-react-wrap">
          <button onClick={() => setReactionMenuOpen((current) => !current)}>React</button>
          {reactionMenuOpen && (
            <div className="reaction-picker">
              <button title="Raise hand" onClick={() => { setReactionMenuOpen(false); void toggleHandRaised(); }}>✋</button>
              {reactionOptions.map((reaction) => (
                <button key={reaction.key} title={reaction.label} onClick={() => { setReactionMenuOpen(false); void sendReaction(reaction.key, reaction.emoji, reaction.label); }}>
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setPanel(panel === "chat" ? "closed" : "chat")}>Chat</button>
        <button onClick={() => setPanel(panel === "attendees" ? "closed" : "attendees")}>People</button>
        <button className="danger" onClick={leaveOnly}>Leave</button>
        {canEnd && <button className="danger" onClick={endForEveryone}>End all</button>}
      </footer>

      {toast !== "Ready" && <div className="live-toast-clean alert-red">{toast}</div>}
    </div>
  );
}
