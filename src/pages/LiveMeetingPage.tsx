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
  onEnterWaiting: () => void | Promise<void>;
  onRefresh: () => void;
  onBack: () => void;
}) {
  const [requestPending, setRequestPending] = useState(false);

  async function handleRequestClick() {
    if (requestPending || status === "waiting" || status === "online") return;
    setRequestPending(true);
    try {
      await onEnterWaiting();
    } finally {
      window.setTimeout(() => setRequestPending(false), 1200);
    }
  }

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
          <button
            className={requestPending || status === "waiting" || status === "online" ? "enter-feedback-active" : ""}
            onClick={handleRequestClick}
            disabled={requestPending || status === "waiting" || status === "online"}
          >
            {requestPending ? "Request sent..." : status === "waiting" ? "Waiting..." : status === "online" ? "Admitted" : "Request to Join Meeting"}
          </button>
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
        min-height: 0;
      }

      .clean-live-main.panel-open {
        grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
        gap: 10px;
      }

      .clean-stage {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        height: calc(100dvh - 138px);
        min-height: 0;
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
        position: fixed;
        inset: 0;
        z-index: 8500;
        overflow: hidden;
      }

      .live-floating-reaction {
        position: absolute;
        left: var(--x, 50%);
        bottom: calc(var(--bottom, 88px) + env(safe-area-inset-bottom, 0px));
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        min-width: 0;
        padding: 0;
        border-radius: 0;
        background: transparent;
        color: #ffffff;
        font-weight: 950;
        text-align: center;
        filter: drop-shadow(0 14px 26px rgba(0,0,0,.34));
        opacity: 0;
        animation: omide-reaction-rise var(--duration, 3300ms) cubic-bezier(.18,.82,.28,1) var(--delay, 0ms) forwards;
        will-change: transform, opacity;
      }

      .live-floating-reaction b {
        display: block;
        font-size: var(--size, clamp(1.55rem, 5vw, 2.8rem));
        line-height: 1;
        font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif;
      }

      .live-floating-reaction span {
        display: inline-block;
        max-width: 130px;
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(6, 20, 109, .72);
        color: #ffffff;
        font-size: .7rem;
        font-weight: 900;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @keyframes omide-reaction-rise {
        0% { opacity: 0; transform: translate3d(-50%, 38px, 0) scale(.62) rotate(0deg); }
        10% { opacity: 1; transform: translate3d(-50%, 0, 0) scale(1) rotate(0deg); }
        42% { opacity: 1; transform: translate3d(calc(-50% + var(--drift, 0px)), -34vh, 0) scale(1.12) rotate(calc(var(--rotate, 0deg) * .45)); }
        76% { opacity: .82; transform: translate3d(calc(-50% - var(--drift, 0px) * .55), -58vh, 0) scale(1.22) rotate(calc(var(--rotate, 0deg) * .75)); }
        100% { opacity: 0; transform: translate3d(-50%, -84vh, 0) scale(1.38) rotate(var(--rotate, 0deg)); }
      }

      @media (prefers-reduced-motion: reduce) {
        .live-floating-reaction {
          animation: omide-reaction-rise-reduced 1100ms ease-out forwards;
        }

        @keyframes omide-reaction-rise-reduced {
          0% { opacity: 0; transform: translate3d(-50%, 20px, 0) scale(.9); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(-50%, -24vh, 0) scale(1); }
        }
      }

      .clean-stage > * {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        flex: 1 1 auto !important;
      }

      .clean-panel {
        height: calc(100dvh - 138px);
        min-height: 0;
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

      .clean-panel-tabs button.waiting-tab-alert {
        background: #ef4444 !important;
        color: #fff !important;
        animation: waiting-red-pulse 1.1s ease-in-out infinite;
      }

      .waiting-tab-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        margin-left: 6px;
        padding: 0 5px;
        border-radius: 999px;
        background: #fff;
        color: #ef4444;
        font-weight: 950;
        font-size: .68rem;
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

      .enter-feedback-active,
      .clean-toolbar .enter-feedback-active {
        background: #13bf54 !important;
        color: #fff !important;
        transform: scale(.96);
        box-shadow: 0 0 0 6px rgba(19,191,84,.16), 0 12px 28px rgba(19,191,84,.22) !important;
        animation: enter-click-pulse .85s ease-in-out infinite;
      }

      .enter-feedback-active:disabled {
        opacity: 1;
        cursor: progress;
      }

      @keyframes enter-click-pulse {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.12); }
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
        justify-content: flex-start;
        gap: 8px;
        padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
        background: rgba(255,255,255,.96);
        border-top: 1px solid rgba(6, 20, 109, .08);
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        z-index: 60;
      }

      .clean-toolbar button {
        min-width: max-content;
        flex: 0 0 auto;
        padding: 9px 13px;
      }

      .speaker-mini-btn {
        min-width: 40px !important;
        width: 40px !important;
        height: 40px !important;
        padding: 0 !important;
        display: grid !important;
        place-items: center !important;
        font-size: 1.05rem !important;
      }

      .speaker-mini-btn.speaker-active {
        background: #13bf54 !important;
        color: #fff !important;
      }


      .control-icon-btn,
      .clean-toolbar .control-icon-btn,
      .toolbar-react-wrap > .control-icon-btn {
        width: 44px;
        height: 44px;
        min-width: 44px !important;
        padding: 0 !important;
        display: grid !important;
        place-items: center !important;
        border-radius: 999px !important;
        font-size: 1.12rem !important;
        position: relative;
      }

      .control-icon-btn .toolbar-label {
        position: static;
        transform: none;
        opacity: 1;
        pointer-events: none;
        white-space: nowrap;
        background: transparent;
        color: inherit;
        border-radius: 0;
        padding: 0;
        font-size: .52rem;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -.02em;
        max-width: 40px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .control-icon-btn,
      .clean-toolbar .control-icon-btn,
      .toolbar-react-wrap > .control-icon-btn {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 2px !important;
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

      /* v1.50 mobile meeting room redesign */
      @media (max-width: 740px) {
        .live-clean-page {
          min-height: 100svh;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
          padding-top: env(safe-area-inset-top);
          padding-bottom: calc(66px + env(safe-area-inset-bottom));
          background: linear-gradient(180deg, #06146d 0%, #0b5798 55%, #f7fbff 55%);
          -webkit-text-size-adjust: 100%;
        }

        .clean-live-topbar {
          min-height: 54px;
          padding: 8px 12px;
          align-items: center;
          flex-direction: row;
          border-bottom: 0;
          background: rgba(255,255,255,.96);
          box-shadow: 0 10px 30px rgba(6, 20, 109, .12);
        }

        .clean-live-brand strong {
          font-size: .92rem;
          line-height: 1.1;
        }

        .clean-live-brand span {
          font-size: .64rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 76vw;
          display: block;
        }

        .clean-live-actions {
          display: none;
        }

        .clean-live-main,
        .clean-live-main.panel-open {
          min-height: calc(100svh - 122px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
          height: auto;
          padding: 0;
          gap: 0;
          overflow: visible;
          display: block;
        }

        .clean-stage {
          height: auto;
          min-height: calc(100svh - 122px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
          width: 100%;
          border-radius: 0;
          box-shadow: none;
          background: linear-gradient(135deg, #06146d, #0b5798);
          overflow: visible;
        }

        .clean-stage > * {
          min-height: calc(100svh - 122px - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important;
          height: auto !important;
        }

        .clean-panel {
          position: fixed;
          left: 10px;
          right: 10px;
          bottom: calc(64px + env(safe-area-inset-bottom));
          height: min(56dvh, 440px);
          min-height: 260px;
          z-index: 180;
          border-radius: 24px;
          box-shadow: 0 24px 80px rgba(2,6,23,.30);
        }

        .clean-panel-head {
          padding: 10px 12px;
        }

        .clean-panel-tabs {
          display: flex;
          padding: 8px 10px;
          gap: 6px;
          overflow-x: auto;
        }

        .clean-panel-tabs button {
          min-width: max-content;
          padding: 7px 10px;
          font-size: .74rem;
        }

        .clean-panel-body {
          padding: 8px;
        }

        .clean-toolbar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 220;
          min-height: calc(58px + env(safe-area-inset-bottom));
          padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
          gap: 7px;
          justify-content: flex-start;
          flex-wrap: nowrap;
          overflow-x: auto;
          background: rgba(255,255,255,.96);
          border-top: 1px solid rgba(6, 20, 109, .10);
          box-shadow: 0 -10px 32px rgba(6,20,109,.14);
          -webkit-overflow-scrolling: touch;
        }

        .clean-toolbar::-webkit-scrollbar {
          display: none;
        }

        .clean-toolbar button {
          min-width: 46px !important;
          width: 46px;
          height: 46px;
          padding: 0 !important;
          border-radius: 999px;
          font-size: 1rem;
          box-shadow: none;
        }

        .control-icon-btn .toolbar-label {
          display: block;
          font-size: .47rem;
          max-width: 42px;
        }

        .clean-toolbar .speaker-mini-btn {
          min-width: 42px !important;
          width: 42px !important;
          height: 42px !important;
          padding: 0 !important;
          font-size: 1.05rem !important;
        }

        .toolbar-react-wrap {
          flex: 0 0 auto;
        }

        .reaction-picker {
          bottom: calc(72px + env(safe-area-inset-bottom));
        }

        .recording-badge {
          top: 10px;
          right: 10px;
          font-size: .72rem;
        }

        .recording-helper {
          display: none;
        }
      }
    `}</style>
  );
}


const reactionOptions = [
  { key: "amen", emoji: "🙌", label: "Amen" },
  { key: "prayer", emoji: "🙏", label: "Prayer" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "thanks", emoji: "👏", label: "Thanks" },
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "cross", emoji: "✝️", label: "Jesus" },
  { key: "blessing", emoji: "💙", label: "Blessing" }
] as const;

type FloatingReaction = {
  id: string;
  emoji: string;
  label: string;
  sender: string;
  x: number;
  drift: number;
  driftEnd: number;
  rotate: number;
  size: number;
  duration: number;
  delay: number;
  bottom: number;
  showSender: boolean;
};

type ParsedReaction = {
  eventId?: string;
  key: string;
  emoji: string;
  label: string;
  sender: string;
};

const REACTION_MESSAGE_PREFIX = "__omideno7_reaction_v2__:";

function makeReactionEventId(profileId?: string | null) {
  return `${profileId || "guest"}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function encodeReaction(eventId: string, key: string, emoji: string, sender: string, label: string) {
  const payload = { eventId, key, emoji, sender, label, createdAt: Date.now() };
  return `${REACTION_MESSAGE_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`;
}

function parseReaction(message: string): ParsedReaction | null {
  if (message.startsWith(REACTION_MESSAGE_PREFIX)) {
    try {
      const payload = JSON.parse(decodeURIComponent(message.slice(REACTION_MESSAGE_PREFIX.length)));
      const key = String(payload.key || "reaction");
      const option = reactionOptions.find((item) => item.key === key);
      return {
        eventId: typeof payload.eventId === "string" ? payload.eventId : undefined,
        key,
        emoji: String(payload.emoji || option?.emoji || "❤️"),
        label: String(payload.label || option?.label || key),
        sender: String(payload.sender || "Member")
      };
    } catch {
      return null;
    }
  }

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

function encodeHandState(profileId: string | null | undefined, raised: boolean) {
  return `__hand__:${profileId || "guest"}:${raised ? "1" : "0"}:${Date.now()}`;
}

function parseHandState(message: string) {
  if (!message.startsWith("__hand__:")) return null;
  const [, profileId = "", raised = "0", timestamp = "0"] = message.split(":");
  if (!profileId) return null;
  return {
    profileId,
    raised: raised === "1" || raised === "true",
    timestamp: Number(timestamp || 0)
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

function deviceLabel() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  return "Device";
}

function isMobileOrTabletDevice() {
  try {
    const ua = navigator.userAgent || "";
    const touchPoints = Number(navigator.maxTouchPoints || 0);
    return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua) || touchPoints > 1;
  } catch {
    return false;
  }
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
  const [handRaised, setHandRaised] = useState(false);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [enterPending, setEnterPending] = useState(false);
  const [enterSignal, setEnterSignal] = useState(0);
  const [recordingElapsed, setRecordingElapsed] = useState("00:00");
  const seenReactionIds = useRef<Set<string>>(new Set());
  const reactionsBooted = useRef(false);
  const handHoldUntilRef = useRef(0);
  const handIntentRef = useRef<boolean | null>(null);
  const handStateMapRef = useRef<Map<string, { raised: boolean; timestamp: number }>>(new Map());
  const liveKitConnectedRef = useRef(false);
  const roomIsOpenRef = useRef(false);
  const meetingEndedHandledRef = useRef(false);

  const effectiveRole = normalizeMeetingRole(myMeetingRole || profile?.role);
  const canHost = Boolean(profile?.status === "approved" && meetingHostRoles.has(effectiveRole));
  const canWaiting = Boolean(profile?.status === "approved" && waitingControlRoles.has(effectiveRole));
  const canEnd = Boolean(profile?.status === "approved" && micControlRoles.has(effectiveRole));
  const canMicControl = Boolean(profile?.status === "approved" && micControlRoles.has(effectiveRole));

  useEffect(() => {
    liveKitConnectedRef.current = liveKitConnected;
  }, [liveKitConnected]);

  useEffect(() => {
    roomIsOpenRef.current = roomIsOpen;
  }, [roomIsOpen]);

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

  function primeBrowserAudioUnlock() {
    try {
      const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        const ctx = new AudioContextCtor();
        void ctx.resume?.().catch(() => undefined);
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.00001;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        window.setTimeout(() => {
          try { oscillator.stop(); ctx.close?.(); } catch { /* ignore */ }
        }, 60);
      }
    } catch {
      // ignore audio unlock errors
    }

    try {
      const audio = document.createElement("audio");
      audio.setAttribute("playsinline", "true");
      audio.preload = "auto";
      audio.volume = 0.00001;
      audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==";
      void audio.play?.().catch(() => undefined);
      window.setTimeout(() => {
        try { audio.pause(); audio.remove(); } catch { /* ignore */ }
      }, 120);
    } catch {
      // ignore audio unlock errors
    }
  }

  function dispatchEnterLiveNow() {
    // This runs inside the real tap/click. It primes mobile audio playback so
    // members can hear the host after pressing Enter without opening their mic.
    primeBrowserAudioUnlock();
    setEnterSignal((value) => value + 1);
    window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action: "unlock-audio" } }));
    window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action: "enter-live" } }));
    // Mobile browsers can miss an event while React is settling after a tap.
    // A short duplicate is safe because RealLiveKitRoom ignores requests while connecting.
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action: "enter-live" } }));
    }, 180);
  }


  function handStorageKey() {
    return profile?.id ? `omide-hand-raised.${profile.id}` : "";
  }

  function readStoredHand() {
    try {
      const key = handStorageKey();
      if (!key) return null;
      const value = localStorage.getItem(key);
      if (value === "true") return true;
      if (value === "false") return false;
      return null;
    } catch {
      return null;
    }
  }

  function storeHand(value: boolean) {
    try {
      const key = handStorageKey();
      if (key) localStorage.setItem(key, value ? "true" : "false");
    } catch {
      // ignore
    }
  }

  function pushFloatingReaction(emoji: string, label: string, sender: string, eventId?: string) {
    const baseId = eventId || makeReactionEventId(profile?.id);
    const burstCount = 9 + Math.floor(Math.random() * 7); // 9–15 floating emojis per click.
    const maxDuration = 5200;
    const senderBadgeIndexes = new Set([0, burstCount >= 13 ? Math.floor(burstCount / 2) : -1]);
    const burst = Array.from({ length: burstCount }, (_, index): FloatingReaction => {
      const duration = 3400 + Math.round(Math.random() * 1450);
      const drift = -72 + Math.round(Math.random() * 144);
      const driftEnd = -96 + Math.round(Math.random() * 192);
      return {
        id: `${baseId}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        emoji,
        label,
        sender,
        x: 6 + Math.round(Math.random() * 88),
        drift,
        driftEnd,
        rotate: -32 + Math.round(Math.random() * 64),
        size: 22 + Math.round(Math.random() * 22),
        duration,
        delay: Math.round(Math.random() * 520),
        bottom: 42 + Math.round(Math.random() * 62),
        showSender: senderBadgeIndexes.has(index)
      };
    });

    setFloatingReactions((current) => [...current.slice(-70), ...burst]);
    window.setTimeout(() => {
      setFloatingReactions((current) => current.filter((item) => !item.id.startsWith(`${baseId}-`)));
    }, maxDuration + 950);
  }

  useEffect(() => {
    const stored = readStoredHand();
    if (stored !== null) {
      handIntentRef.current = stored;
      setHandRaised(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

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

    const nextRoomIsOpen = Boolean(settings?.live_open);
    const wasRoomOpen = roomIsOpenRef.current;
    setRoomIsOpen(nextRoomIsOpen);
    roomIsOpenRef.current = nextRoomIsOpen;
    setChatMode(settings?.chat_mode || "public");

    if (!nextRoomIsOpen && liveKitConnectedRef.current && !meetingEndedHandledRef.current) {
      meetingEndedHandledRef.current = true;
      window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action: "force-disconnect" } }));
      setLiveKitConnected(false);
      setEnterPending(false);
      setMicOn(false);
      setCameraOn(false);
      notify(wasRoomOpen ? "Meeting was ended for everyone." : "Meeting is closed.");
      setRoute(canHost ? "ownerDashboard" : "memberHome");
    }

    if (nextRoomIsOpen) {
      meetingEndedHandledRef.current = false;
    }

    const visibleMessages: RoomChatMessage[] = [];
    const reactionRows: RoomChatMessage[] = [];
    const nextHandMap = new Map(handStateMapRef.current);

    for (const row of chatRows) {
      const handState = parseHandState(row.message || "");
      if (handState) {
        const existing = nextHandMap.get(handState.profileId);
        if (!existing || handState.timestamp >= existing.timestamp) {
          nextHandMap.set(handState.profileId, { raised: handState.raised, timestamp: handState.timestamp });
        }
        continue;
      }

      const reaction = parseReaction(row.message || "");
      if (reaction) {
        reactionRows.push(row);
        continue;
      }

      if (row.target_type === "everyone" || canHost || row.target_id === profile?.id) {
        visibleMessages.push(row);
      }
    }

    const storedHand = readStoredHand();
    const currentHand = handIntentRef.current ?? storedHand ?? Boolean(myRow?.hand_raised ?? handRaised);
    if (profile?.id) {
      nextHandMap.set(profile.id, { raised: currentHand, timestamp: Number.MAX_SAFE_INTEGER });
    }
    handStateMapRef.current = nextHandMap;

    setParticipants(rows.filter((row) => row.status === "online").map((row) => {
      const mapped = row.profile_id ? nextHandMap.get(row.profile_id) : null;
      return {
        ...row,
        hand_raised: row.profile_id === profile?.id ? currentHand : Boolean(mapped?.raised ?? row.hand_raised)
      };
    }));
    setWaiting(rows.filter((row) => row.status === "waiting"));
    if (myRow || profile?.id) setHandRaised(currentHand);

    if (!reactionsBooted.current) {
      reactionRows.forEach((row) => {
        const reaction = parseReaction(row.message || "");
        seenReactionIds.current.add(reaction?.eventId || row.id);
      });
      reactionsBooted.current = true;
    } else {
      for (const row of reactionRows) {
        const reaction = parseReaction(row.message || "");
        const reactionId = reaction?.eventId || row.id;
        if (seenReactionIds.current.has(reactionId)) continue;
        seenReactionIds.current.add(reactionId);
        if (reaction) pushFloatingReaction(reaction.emoji, reaction.label, reaction.sender, reactionId);
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
      if (liveKitConnectedRef.current) {
        window.dispatchEvent(new CustomEvent("omide-livekit-control", { detail: { action: "force-disconnect" } }));
        setLiveKitConnected(false);
        liveKitConnectedRef.current = false;
        setMicOn(false);
        setCameraOn(false);
      }
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
  }, [profile?.id, profile?.displayName, profile?.avatarUrl, profile?.role, canHost]);

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
    const saved = await meetingRoomService.setParticipantMicPermission(person.id, allow);
    notify(saved
      ? (allow ? `${person.display_name} can unmute now. They must press Unmute themselves.` : `${person.display_name} microphone locked and will be muted automatically.`)
      : "Microphone control did not save in Supabase. Run the v1.47 SQL patch.");
    await refreshRoom();
  }


  async function togglePersonScreenShare(person: RoomParticipant) {
    if (!canHost) return notify("Only host roles can allow screen share.");
    const allow = !(person as any).allowed_screen_share;
    const saved = await meetingRoomService.setParticipantScreenSharePermission(person.id, allow);
    notify(saved ? (allow ? `${person.display_name} can share screen now.` : `${person.display_name} screen share disabled.`) : "Screen share permission did not save. Run the v1.49 SQL patch.");
    await refreshRoom();
  }

  async function makeCoHost(person: RoomParticipant) {
    if (!canHost) return notify("Only host roles can change meeting roles.");
    const roleSaved = await meetingRoomService.updateParticipantRole(person.id, "co_host");
    const profileSaved = await meetingRoomService.updateProfileRole(person.profile_id, "co_host");
    notify(roleSaved || profileSaved ? `${person.display_name} is now co-host.` : "Co-host change did not save. Run the v1.47 SQL patch.");
    await refreshRoom();
  }

  async function makeMember(person: RoomParticipant) {
    if (!canHost) return notify("Only host roles can change meeting roles.");
    const roleSaved = await meetingRoomService.updateParticipantRole(person.id, "approved_member");
    const profileSaved = await meetingRoomService.updateProfileRole(person.profile_id, "approved_member");
    notify(roleSaved || profileSaved ? `${person.display_name} is now member.` : "Role change did not save. Run the v1.47 SQL patch.");
    await refreshRoom();
  }

  function startDirectMessage(person: RoomParticipant) {
    setPanel("chat");
    setChatTarget(person.profile_id || person.id);
    setChatInput(`@${person.display_name} `);
    notify(`Direct message to ${person.display_name}.`);
  }

  async function startHostRoom() {
    if (!canHost || enterPending) return;
    const mobileHost = isMobileOrTabletDevice();

    setEnterPending(true);
    setRoomIsOpen(true);
    roomIsOpenRef.current = true;
    meetingEndedHandledRef.current = false;
    notify(mobileHost ? "Connecting mobile host..." : "Opening live...");

    // Important for phone/tablet: begin the LiveKit connection immediately from
    // the tap flow. Do not wait for Supabase room bookkeeping first.
    dispatchEnterLiveNow();

    try {
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
      notify(mobileHost
        ? "Mobile host is connecting. If it does not open, use the green iPhone/iPad Start button inside the meeting screen."
        : "Live room opened. Host microphone will start automatically...");
    } catch {
      // The host token does not depend on this bookkeeping call. Keep the live
      // connection attempt running, but show a simple warning.
      notify("Live is connecting. Room status will refresh shortly.");
    } finally {
      window.setTimeout(() => {
        if (!liveKitConnected) setEnterPending(false);
      }, 24000);
    }
  }

  async function handleEnterButtonClick() {
    if (enterPending) return;

    if (canHost) {
      await startHostRoom();
      return;
    }

    setEnterPending(true);
    notify("Entering live...");
    dispatchEnterLiveNow();
    window.setTimeout(() => setEnterPending(false), 2200);
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
    const eventId = makeReactionEventId(profile?.id);
    seenReactionIds.current.add(eventId);
    pushFloatingReaction(emoji, label, sender, eventId);
    await meetingRoomService.sendChat(profile, encodeReaction(eventId, key, emoji, sender, label), "everyone", null);
  }

  async function toggleHandRaised() {
    if (!profile?.id) return;
    const myId = roomParticipantId(meetingRoomService.meetingId, profile.id);
    const myRow = participants.find((item) => item.id === myId) || await meetingRoomService.getMyRow(profile);
    const current = handIntentRef.current ?? Boolean(myRow?.hand_raised ?? handRaised);
    const next = !current;
    handIntentRef.current = next;
    handHoldUntilRef.current = Number.MAX_SAFE_INTEGER;
    storeHand(next);
    setHandRaised(next);
    handStateMapRef.current.set(profile.id, { raised: next, timestamp: Number.MAX_SAFE_INTEGER });
    setParticipants((currentRows) => currentRows.map((row) =>
      row.profile_id === profile.id ? { ...row, hand_raised: next } : row
    ));
    void meetingRoomService.sendChat(profile, encodeHandState(profile.id, next), "everyone", null).catch(() => undefined);
    const saved = await meetingRoomService.setMyHandRaised(profile, next);
    notify(saved ? (next ? "Hand raised." : "Hand lowered.") : "Hand is shown locally, but server sync failed.");
    window.setTimeout(() => void refreshRoom(), 1800);
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
      allowed_screen_share: Boolean((currentRow as any)?.allowed_screen_share),
      hand_raised: Boolean(handIntentRef.current ?? currentRow?.hand_raised ?? handRaised)
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
    meetingEndedHandledRef.current = true;
    await meetingRoomService.endMeetingForEveryone();
    setLiveKitConnected(false);
    liveKitConnectedRef.current = false;
    setMicOn(false);
    setCameraOn(false);
    setRoomIsOpen(false);
    roomIsOpenRef.current = false;
    notify("Meeting ended and chat cleared.");
    setRoute(canHost ? "ownerDashboard" : "memberHome");
  }

  const myRowForControls = participants.find((item) => item.profile_id === profile?.id);
  const canShareScreenNow = Boolean(canHost || (myRowForControls as any)?.allowed_screen_share);
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
          <strong>OmideNo7 Meetings</strong>
          <span>v1.70 · {deviceLabel()} · {liveKitConnected ? "Connected" : enterPending ? "Entering" : roomIsOpen ? "Ready" : "Waiting"}{toast !== "Ready" ? ` · ${toast}` : ""}</span>
        </div>

        <div className="clean-live-actions">
          {canHost && !roomIsOpen && (
            <button className={enterPending ? "green enter-feedback-active" : "green"} onClick={handleEnterButtonClick} disabled={enterPending}>
              {enterPending ? "Opening..." : "Open & enter live"}
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
          <RealLiveKitRoom
            profile={profile}
            meetingId="main-room"
            admitted={canHost || myStatus === "online"}
            autoStart={false}
            confirmBeforeStart={canHost}
            enterSignal={enterSignal}
            onConnectionChange={async (connected) => {
              setLiveKitConnected(connected);
              if (connected) {
                setEnterPending(false);
              } else {
                window.setTimeout(() => setEnterPending(false), 700);
              }
              if (connected && canHost) {
                await meetingRoomService.openMeetingForEveryone();
                setRoomIsOpen(true);
              }
            }}
            onMediaStateChange={handleMediaState}
            onStatusChange={({ status, error, connected }) => {
              if (connected) {
                setEnterPending(false);
                return;
              }
              if (status.toLowerCase().includes("failed") || status.toLowerCase().includes("cannot")) {
                setEnterPending(false);
                notify(error || status);
              }
            }}
            participants={participants}
            localHandRaised={handRaised}
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
                style={{
                  "--x": `${reaction.x}%`,
                  "--drift": `${reaction.drift}px`,
                  "--drift-end": `${reaction.driftEnd}px`,
                  "--rotate": `${reaction.rotate}deg`,
                  "--size": `${reaction.size}px`,
                  "--duration": `${reaction.duration}ms`,
                  "--delay": `${reaction.delay}ms`,
                  "--bottom": `${reaction.bottom}px`
                } as CSSProperties}
              >
                <b>{reaction.emoji}</b>
                {reaction.showSender ? <span>{reaction.sender}</span> : null}
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
              {canWaiting && (
                <button
                  className={`${panel === "waiting" ? "active" : ""} ${waiting.length ? "waiting-tab-alert" : ""}`}
                  onClick={() => setPanel("waiting")}
                >
                  Waiting{waiting.length > 0 && <span className="waiting-tab-count">{waiting.length}</span>}
                </button>
              )}
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
                              <button onClick={() => togglePersonScreenShare(person)}>{(person as any).allowed_screen_share ? "Disable screen share" : "Allow screen share"}</button>
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

      <footer className="clean-toolbar" aria-label="Meeting controls">
        {!liveKitConnected && (
          <button
            className={enterPending ? "green control-icon-btn enter-feedback-active" : "green control-icon-btn"}
            title="Enter"
            aria-label="Enter"
            onClick={handleEnterButtonClick}
            disabled={enterPending}
          >
            {enterPending ? "⏳" : "▶️"}<span className="toolbar-label">{enterPending ? "Wait" : "Enter"}</span>
          </button>
        )}
        <button className="control-icon-btn" title={micOn ? "Mute" : "Microphone"} aria-label={micOn ? "Mute" : "Microphone"} onClick={() => liveKitConnected ? sendLiveKitControl("mic") : notify("Enter live first") }>
          {micOn ? "🔇" : "🎙️"}<span className="toolbar-label">{micOn ? "Mute" : "Mic"}</span>
        </button>
        <button className="control-icon-btn" title={cameraOn ? "Camera off" : "Camera"} aria-label={cameraOn ? "Camera off" : "Camera"} onClick={() => liveKitConnected ? sendLiveKitControl("camera") : notify("Enter live room first.")}>
          {cameraOn ? "📷" : "🎥"}<span className="toolbar-label">Camera</span>
        </button>
        {canShareScreenNow && (
          <button className="control-icon-btn" title="Share screen" aria-label="Share screen" onClick={() => liveKitConnected ? sendLiveKitControl("screen") : notify("Enter live room first.")}>
            🖥️<span className="toolbar-label">Share</span>
          </button>
        )}
        {canHost && (
          <button className={recording ? "danger control-icon-btn" : "control-icon-btn"} title="Record" aria-label="Record" onClick={toggleRecordingMarker}>
            ⏺<span className="toolbar-label">Record</span>
          </button>
        )}
        <div className="toolbar-react-wrap">
          <button className="control-icon-btn" title="React" aria-label="React" onClick={() => setReactionMenuOpen((current) => !current)}>
            ✨<span className="toolbar-label">React</span>
          </button>
        </div>
        <button className="control-icon-btn" title="Chat" aria-label="Chat" onClick={() => setPanel(panel === "chat" ? "closed" : "chat")}>
          💬<span className="toolbar-label">Chat</span>
        </button>
        <button className="control-icon-btn" title="People" aria-label="People" onClick={() => setPanel(panel === "attendees" ? "closed" : "attendees")}>
          👥<span className="toolbar-label">People</span>
        </button>
        <button className="danger control-icon-btn" title="Leave" aria-label="Leave" onClick={leaveOnly}>
          🚪<span className="toolbar-label">Leave</span>
        </button>
        {canEnd && <button className="danger control-icon-btn" title="End all" aria-label="End all" onClick={endForEveryone}>⛔<span className="toolbar-label">End all</span></button>}
      </footer>

      {reactionMenuOpen && (
        <div className="reaction-picker-overlay" onClick={() => setReactionMenuOpen(false)}>
          <div className="reaction-picker" role="menu" aria-label="Reactions" onClick={(event) => event.stopPropagation()}>
            <button title="Raise hand" aria-label="Raise hand" onClick={() => { setReactionMenuOpen(false); void toggleHandRaised(); }}>✋</button>
            {reactionOptions.map((reaction) => (
              <button key={reaction.key} title={reaction.label} aria-label={reaction.label} onClick={() => { setReactionMenuOpen(false); void sendReaction(reaction.key, reaction.emoji, reaction.label); }}>
                {reaction.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action status is shown in the top bar to keep the meeting room clean. */}
    </div>
  );
}
