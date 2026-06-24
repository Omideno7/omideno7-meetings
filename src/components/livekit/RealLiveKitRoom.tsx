import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import type { UserProfile } from "../../types/roles";
import type { RoomParticipant } from "../../services/meetingRoomService";
import { liveKitTokenService } from "../../services/liveKitTokenService";
import { liveKitReadyConfig } from "../../config/liveKitReady";

type Props = {
  profile: UserProfile | null;
  admitted: boolean;
  meetingId: string;
  autoStart?: boolean;
  confirmBeforeStart?: boolean;
  onConnectionChange?: (connected: boolean) => void | Promise<void>;
  onMediaStateChange?: (state: { mic: boolean; camera: boolean }) => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
  participants?: RoomParticipant[];
};

type LiveTile = {
  key: string;
  name: string;
  isLocal: boolean;
  cameraOn: boolean;
  screenOn: boolean;
  micOn: boolean;
  cameraTrack: any | null;
  screenTrack: any | null;
  microphoneTrack: any | null;
  audioLevel: number;
  profileId: string | null;
  avatarUrl: string | null;
  handRaised: boolean;
};

function VideoTrackView({ track, muted }: { track: any | null; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !track) return;

    try {
      track.attach(element);
    } catch {
      // ignore
    }

    return () => {
      try {
        track.detach(element);
      } catch {
        // ignore
      }
    };
  }, [track]);

  if (!track) return null;

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className="omide-video-el"
    />
  );
}

function AudioTrackView({ track }: { track: any | null }) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !track) return;

    try {
      track.attach(element);
    } catch {
      // ignore
    }

    return () => {
      try {
        track.detach(element);
      } catch {
        // ignore
      }
    };
  }, [track]);

  if (!track) return null;

  return <audio ref={ref} autoPlay playsInline />;
}

function getPublications(participant: any) {
  const publications =
    participant?.trackPublications ||
    participant?.tracks ||
    new Map();

  return Array.from(publications.values()) as any[];
}

function pickPublication(publications: any[], source: Track.Source, kind: Track.Kind) {
  const exactSource = publications.find((publication: any) => publication?.source === source);
  if (exactSource) return exactSource;
  return publications.find((publication: any) => publication?.kind === kind);
}

function pickExactSource(publications: any[], source: Track.Source) {
  return publications.find((publication: any) => publication?.source === source);
}

function safeMetadata(participant: any) {
  try {
    return JSON.parse(participant?.metadata || "{}") as { profileId?: string; avatarUrl?: string; role?: string };
  } catch {
    return {} as { profileId?: string; avatarUrl?: string; role?: string };
  }
}

function tileFromParticipant(participant: any, isLocal: boolean, participantRows: RoomParticipant[] = [], localProfile?: UserProfile | null): LiveTile {
  const publications = getPublications(participant);

  const cameraPublication = pickPublication(publications, Track.Source.Camera, Track.Kind.Video);
  const micPublication = pickPublication(publications, Track.Source.Microphone, Track.Kind.Audio);
  const screenPublication = pickExactSource(publications, Track.Source.ScreenShare);

  const cameraTrack =
    cameraPublication?.track ||
    cameraPublication?.videoTrack ||
    null;

  const microphoneTrack =
    micPublication?.track ||
    micPublication?.audioTrack ||
    null;

  const screenTrack =
    screenPublication?.track ||
    screenPublication?.videoTrack ||
    null;

  const cameraMuted =
    Boolean(cameraPublication?.isMuted) ||
    Boolean(cameraPublication?.muted) ||
    Boolean(cameraTrack?.isMuted);

  const micMuted =
    Boolean(micPublication?.isMuted) ||
    Boolean(micPublication?.muted) ||
    Boolean(microphoneTrack?.isMuted);

  const screenMuted =
    Boolean(screenPublication?.isMuted) ||
    Boolean(screenPublication?.muted) ||
    Boolean(screenTrack?.isMuted);

  const audioLevel = Math.max(0, Math.min(Number(participant?.audioLevel || 0), 1));
  const metadata = safeMetadata(participant);
  const name = participant?.name || participant?.identity || (isLocal ? "You" : "Participant");
  const profileId = metadata.profileId || String(participant?.identity || "").split(":")[0] || null;
  const matchedRow = participantRows.find((row) => {
    if (profileId && row.profile_id === profileId) return true;
    return row.display_name === name;
  });

  return {
    key: participant?.sid || participant?.identity || participant?.name || (isLocal ? "local" : crypto.randomUUID()),
    name,
    isLocal,
    cameraOn: Boolean(cameraTrack && !cameraMuted),
    screenOn: Boolean(screenTrack && !screenMuted),
    micOn: Boolean(microphoneTrack && !micMuted),
    cameraTrack,
    screenTrack,
    microphoneTrack,
    audioLevel,
    profileId,
    avatarUrl: matchedRow?.avatar_url || metadata.avatarUrl || (isLocal ? localProfile?.avatarUrl || null : null),
    handRaised: Boolean(matchedRow?.hand_raised)
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "O7";
}

function isHostRole(profile: UserProfile | null) {
  if (!profile) return false;

  return [
    "owner",
    "senior_host",
    "meeting_host",
    "co_host",
    "door_servant",
    "media_servant",
    "prayer_servant",
    "chat_moderator"
  ].includes(profile.role);
}

function browserNotice() {
  const ua = navigator.userAgent || "";
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua);

  if (isSafari || isIOS) {
    return "Safari/iOS can block WebRTC. Chrome is recommended for the first stable version.";
  }

  return "";
}

export function RealLiveKitRoom({
  profile,
  admitted,
  meetingId,
  autoStart = false,
  confirmBeforeStart = true,
  onConnectionChange,
  onMediaStateChange,
  onLeave,
  participants = []
}: Props) {
  const roomRef = useRef<Room | null>(null);
  const connectingRef = useRef(false);
  const autoTriedRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [tiles, setTiles] = useState<LiveTile[]>([]);
  const [needsStart, setNeedsStart] = useState(Boolean(confirmBeforeStart));
  const [notice] = useState(browserNotice());

  const canEnter = Boolean(profile?.status === "approved" && (isHostRole(profile) || admitted));

  function refreshTiles(room?: Room | null) {
    const activeRoom = room || roomRef.current;

    if (!activeRoom) {
      setTiles([]);
      return;
    }

    const nextTiles: LiveTile[] = [
      tileFromParticipant(activeRoom.localParticipant, true, participants, profile),
      ...Array.from(activeRoom.remoteParticipants.values()).map((participant: any) =>
        tileFromParticipant(participant, false, participants, profile)
      )
    ];

    setTiles(nextTiles);
  }

  function wireRoom(room: Room) {
    const update = () => refreshTiles(room);

    room.on(RoomEvent.Connected, async () => {
      setConnected(true);
      setStatus("Connected");
      setError("");
      refreshTiles(room);
      await onConnectionChange?.(true);

      setMicOn(false);
      setCameraOn(false);
      setScreenOn(false);
      await onMediaStateChange?.({ mic: false, camera: false });
    });

    room.on(RoomEvent.Disconnected, async () => {
      setConnected(false);
      setStatus("Disconnected");
      refreshTiles(room);
      await onConnectionChange?.(false);
    });

    room.on(RoomEvent.ParticipantConnected, update);
    room.on(RoomEvent.ParticipantDisconnected, update);
    room.on(RoomEvent.TrackSubscribed, update);
    room.on(RoomEvent.TrackUnsubscribed, update);
    room.on(RoomEvent.TrackPublished, update);
    room.on(RoomEvent.TrackUnpublished, update);
    room.on(RoomEvent.TrackMuted, update);
    room.on(RoomEvent.TrackUnmuted, update);
    room.on(RoomEvent.LocalTrackPublished, update);
    room.on(RoomEvent.LocalTrackUnpublished, update);
    room.on(RoomEvent.ActiveSpeakersChanged, update);
  }

  async function connect(forceStart = false) {
    if (connectingRef.current || connected) return;

    if (!canEnter) {
      setError("Members must wait for host admission.");
      setStatus("Waiting Room");
      return;
    }

    if (needsStart && !forceStart) {
      setStatus("Ready to start");
      return;
    }

    connectingRef.current = true;
    setNeedsStart(false);
    setError("");
    setStatus("Requesting secure LiveKit token...");

    try {
      const result = await liveKitTokenService.requestToken({
        meetingId,
        profile,
        admitted: isHostRole(profile) || admitted
      });

      if (!result.ok) {
        setStatus("Cannot enter live room");
        setError(result.message || result.reason || "LiveKit token error.");
        await onConnectionChange?.(false);
        return;
      }

      // Always create a fresh room on each explicit enter.
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
        } catch {
          // ignore
        }
        roomRef.current = null;
      }

      setStatus("Connecting to LiveKit room...");

      const room = new Room({
        adaptiveStream: true,
        dynacast: true
      });

      roomRef.current = room;
      wireRoom(room);

      // Do not wrap room.connect in our own timeout.
      // Previous timeout/abort handling could trigger "Abort handler called" in some browsers.
      await room.connect(result.wsUrl || liveKitReadyConfig.wsUrl, result.token, {
        autoSubscribe: true
      });

      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 500);
      window.setTimeout(() => refreshTiles(room), 1500);
    } catch (err: any) {
      console.error("LiveKit connection error:", err);

      try {
        roomRef.current?.disconnect();
      } catch {
        // ignore
      }

      roomRef.current = null;
      setConnected(false);
      setStatus("Connection failed");
      setError(err?.message || "Could not connect to LiveKit room.");
      await onConnectionChange?.(false);
    } finally {
      connectingRef.current = false;
    }
  }

  async function disconnect(markLeave = true) {
    const room = roomRef.current;

    try {
      if (room) {
        await room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
        await room.localParticipant.setCameraEnabled(false).catch(() => undefined);
        room.disconnect();
      }
    } finally {
      roomRef.current = null;
      setConnected(false);
      setMicOn(false);
      setCameraOn(false);
      setScreenOn(false);
      setTiles([]);
      setStatus("Left meeting");
      await onMediaStateChange?.({ mic: false, camera: false });
      await onConnectionChange?.(false);
      if (markLeave) await onLeave?.();
    }
  }

  async function toggleMic() {
    const room = roomRef.current;
    if (!room || !connected) {
      setError("Enter the live room first.");
      return;
    }

    const next = !micOn;

    if (next && !isHostRole(profile)) {
      const myRow = participants.find((row) => row.profile_id === profile?.id);
      if (myRow && myRow.allowed_mic === false) {
        setError("The host has locked your microphone. Please raise your hand or ask the host to allow unmute.");
        return;
      }
    }

    setMicOn(next);

    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      refreshTiles(room);
      await onMediaStateChange?.({ mic: next, camera: cameraOn });
    } catch (err: any) {
      setMicOn(!next);
      setError(err?.message || "Could not change microphone.");
    }
  }

  async function forceMicOff() {
    const room = roomRef.current;
    setMicOn(false);

    try {
      if (room) {
        await room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
        refreshTiles(room);
      }
      await onMediaStateChange?.({ mic: false, camera: cameraOn });
    } catch (err: any) {
      setError(err?.message || "Could not force microphone off.");
    }
  }

  async function toggleCamera() {
    const room = roomRef.current;
    if (!room || !connected) {
      setError("Enter the live room first.");
      return;
    }

    const next = !cameraOn;
    setCameraOn(next);

    try {
      await room.localParticipant.setCameraEnabled(next);
      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 650);
      await onMediaStateChange?.({ mic: micOn, camera: next });
    } catch (err: any) {
      setCameraOn(!next);
      setError(err?.message || "Could not change camera.");
    }
  }

  async function toggleScreenShare() {
    const room = roomRef.current;
    if (!room || !connected) {
      setError("Enter the live room first.");
      return;
    }

    const next = !screenOn;
    setScreenOn(next);

    try {
      // Let Chrome show the full native chooser: Entire screen, window, or browser tab.
      // Do not force displaySurface to "browser", because that can hide desktop/window choices.
      await (room.localParticipant as any).setScreenShareEnabled(next, {
        audio: true,
        systemAudio: "include",
        selfBrowserSurface: "include",
        surfaceSwitching: "include",
        monitorTypeSurfaces: "include"
      });
      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 650);
    } catch (err: any) {
      setScreenOn(!next);
      setError(err?.message || "Could not start screen share. On macOS Chrome, share a browser tab and tick Share tab audio when you need music audio.");
    }
  }

  useEffect(() => {
    if (!autoStart) return;
    if (needsStart) return;
    if (autoTriedRef.current) return;
    if (!canEnter) return;

    autoTriedRef.current = true;
    void connect(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, needsStart, canEnter, meetingId]);

  useEffect(() => {
    const timer = window.setInterval(() => refreshTiles(), 700);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    refreshTiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants]);

  useEffect(() => {
    function handleLiveKitControl(event: Event) {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "enter-live") void connect(true);
      if (action === "mic") void toggleMic();
      if (action === "force-mic-off") void forceMicOff();
      if (action === "camera") void toggleCamera();
      if (action === "screen") void toggleScreenShare();
      if (action === "leave") void disconnect(true);
      if (action === "force-disconnect") void disconnect(false);
    }

    window.addEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
    return () => window.removeEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
  }, [micOn, cameraOn, screenOn, connected, participants]);

  useEffect(() => {
    return () => {
      try {
        roomRef.current?.disconnect();
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <section className="omide-livekit-clean">
      <style>{`
        .omide-livekit-clean {
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
          padding: 12px !important;
          border-radius: 22px !important;
          background: linear-gradient(135deg, #06146d, #0b5798) !important;
          color: #fff !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          min-height: 100% !important;
        }

        .omide-livekit-clean-head {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 12px !important;
          width: 100% !important;
        }

        .omide-livekit-clean-title {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
          min-width: 0 !important;
        }

        .omide-livekit-clean-title strong {
          color: #fff !important;
          font-size: 1rem !important;
          line-height: 1.1 !important;
        }

        .omide-livekit-clean-title span {
          color: rgba(255,255,255,.78) !important;
          font-size: .76rem !important;
          line-height: 1.2 !important;
        }

        .omide-livekit-clean-actions {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 8px !important;
          flex-wrap: wrap !important;
        }

        .omide-livekit-clean-actions button {
          border: 0 !important;
          border-radius: 999px !important;
          padding: 9px 12px !important;
          background: rgba(255,255,255,.16) !important;
          color: #fff !important;
          font-weight: 800 !important;
          cursor: pointer !important;
        }

        .omide-livekit-clean-actions button.primary {
          background: #13bf54 !important;
        }

        .omide-livekit-clean-actions button.danger {
          background: #ef4444 !important;
        }

        .omide-livekit-clean-actions button:disabled {
          opacity: .5 !important;
          cursor: not-allowed !important;
        }

        .omide-livekit-clean-status,
        .omide-livekit-clean-notice {
          width: 100% !important;
          border-radius: 16px !important;
          padding: 9px 12px !important;
          background: rgba(255,255,255,.12) !important;
          color: #fff !important;
          font-weight: 700 !important;
          font-size: .82rem !important;
        }

        .omide-livekit-clean-notice {
          background: rgba(19,191,84,.18) !important;
        }

        .omide-livekit-clean-error {
          width: 100% !important;
          border-radius: 16px !important;
          padding: 9px 12px !important;
          background: rgba(239,68,68,.22) !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,.18) !important;
          font-weight: 800 !important;
          font-size: .82rem !important;
        }

        .omide-livekit-clean-grid {
          width: 100% !important;
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
          gap: 12px !important;
          align-items: stretch !important;
          justify-items: stretch !important;
          min-height: 260px !important;
          flex: 1 1 auto !important;
          overflow-y: auto !important;
          padding: 2px !important;
          box-sizing: border-box !important;
        }

        .omide-livekit-clean-tile {
          position: relative !important;
          width: 100% !important;
          min-width: 0 !important;
          aspect-ratio: 1 / 1 !important;
          min-height: 190px !important;
          max-height: 420px !important;
          overflow: hidden !important;
          border-radius: 20px !important;
          background: #020617 !important;
          border: 1px solid rgba(255,255,255,.16) !important;
          box-shadow: 0 18px 38px rgba(0,0,0,.28) !important;
        }

        .omide-video-el {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          min-width: 0 !important;
          min-height: 0 !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
          object-position: center center !important;
          border-radius: 0 !important;
          background: #020617 !important;
          transform: none !important;
        }

        .omide-livekit-clean-avatar {
          width: 100% !important;
          height: 100% !important;
          display: grid !important;
          place-items: center !important;
          background: radial-gradient(circle at top, #0b5798, #06146d) !important;
        }

        .omide-livekit-clean-avatar span,
        .omide-livekit-clean-avatar-img {
          width: 70px !important;
          height: 70px !important;
          border-radius: 22px !important;
          display: grid !important;
          place-items: center !important;
          background: rgba(255,255,255,.17) !important;
          color: #fff !important;
          font-weight: 950 !important;
          font-size: 1.55rem !important;
        }

        .omide-livekit-clean-avatar-img {
          object-fit: cover !important;
          border: 2px solid rgba(255,255,255,.42) !important;
          box-shadow: 0 12px 30px rgba(0,0,0,.25) !important;
        }

        .omide-livekit-hand-badge {
          position: absolute !important;
          top: 10px !important;
          left: 10px !important;
          z-index: 18 !important;
          min-width: 34px !important;
          height: 34px !important;
          padding: 0 9px !important;
          border-radius: 999px !important;
          display: grid !important;
          place-items: center !important;
          background: rgba(255, 214, 10, .95) !important;
          color: #111827 !important;
          font-weight: 950 !important;
          box-shadow: 0 12px 26px rgba(0,0,0,.32) !important;
        }

        .omide-livekit-clean-namebar {
          position: absolute !important;
          left: 8px !important;
          right: 8px !important;
          bottom: 8px !important;
          z-index: 10 !important;
          border-radius: 14px !important;
          padding: 7px 9px !important;
          background: rgba(0,0,0,.62) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 8px !important;
          color: #fff !important;
          backdrop-filter: blur(8px) !important;
        }

        .omide-livekit-clean-namebar strong {
          color: #fff !important;
          font-size: .78rem !important;
          line-height: 1.1 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .omide-livekit-clean-namebar small {
          color: rgba(255,255,255,.86) !important;
          font-size: .68rem !important;
          white-space: nowrap !important;
        }

        .omide-livekit-clean-eq {
          position: absolute !important;
          left: 10px !important;
          bottom: 48px !important;
          width: 44px !important;
          height: 6px !important;
          border-radius: 999px !important;
          background: rgba(19,191,84,.25) !important;
          overflow: hidden !important;
          z-index: 12 !important;
        }

        .omide-livekit-clean-eq span {
          display: block !important;
          height: 100% !important;
          border-radius: 999px !important;
          background: #13bf54 !important;
          transition: width .18s ease !important;
        }

        .omide-livekit-clean-empty {
          width: 100% !important;
          min-height: 240px !important;
          border-radius: 20px !important;
          display: grid !important;
          place-items: center !important;
          background: rgba(2,6,23,.45) !important;
          color: rgba(255,255,255,.86) !important;
          font-weight: 800 !important;
          flex: 1 1 auto !important;
        }

        @media (max-width: 740px) {
          .omide-livekit-clean {
            padding: 8px !important;
            border-radius: 18px !important;
          }

          .omide-livekit-clean-head {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .omide-livekit-clean-actions {
            width: 100% !important;
            justify-content: flex-start !important;
          }

          .omide-livekit-clean-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            min-height: 220px !important;
          }

          .omide-livekit-clean-tile {
            min-height: 135px !important;
            max-height: 190px !important;
            border-radius: 16px !important;
          }

          .omide-livekit-clean-namebar {
            left: 6px !important;
            right: 6px !important;
            bottom: 6px !important;
            padding: 5px 7px !important;
          }

          .omide-livekit-clean-namebar strong {
            font-size: .65rem !important;
          }

          .omide-livekit-clean-namebar small {
            font-size: .55rem !important;
          }

          .omide-livekit-clean-avatar span,
          .omide-livekit-clean-avatar-img {
            width: 52px !important;
            height: 52px !important;
            border-radius: 18px !important;
            font-size: 1.2rem !important;
          }

          .omide-livekit-hand-badge {
            top: 7px !important;
            left: 7px !important;
            min-width: 30px !important;
            height: 30px !important;
            font-size: .9rem !important;
          }
        }
      `}</style>

      <div className="omide-livekit-clean-head">
        <div className="omide-livekit-clean-title">
          <strong>OmideNo7 Live Room</strong>
          <span>{connected ? "Connected to LiveKit" : "Members enter after host admission"}</span>
        </div>

        <div className="omide-livekit-clean-actions">
          {!connected && (
            <button
              className="primary"
              type="button"
              onClick={() => void connect(true)}
              disabled={!canEnter || connectingRef.current}
            >
              {connectingRef.current ? "Connecting..." : "Enter live"}
            </button>
          )}

          <button type="button" onClick={toggleMic} disabled={!connected}>
            {micOn ? "Mute" : "Unmute"}
          </button>

          <button type="button" onClick={toggleCamera} disabled={!connected}>
            {cameraOn ? "Camera off" : "Camera on"}
          </button>

          <button type="button" onClick={toggleScreenShare} disabled={!connected}>
            {screenOn ? "Stop share" : "Share screen"}
          </button>

          <button className="danger" type="button" onClick={() => void disconnect(true)}>
            Leave
          </button>
        </div>
      </div>

      <div className="omide-livekit-clean-status">{status}</div>

      {notice && (
        <div className="omide-livekit-clean-notice">
          {notice}
        </div>
      )}

      {error && (
        <div className="omide-livekit-clean-error">
          {error}
        </div>
      )}

      {tiles.length === 0 ? (
        <div className="omide-livekit-clean-empty">
          {canEnter ? "Ready to enter live room" : "Waiting for host admission"}
        </div>
      ) : (
        <div className="omide-livekit-clean-grid">
          {tiles.map((tile) => (
            <article className="omide-livekit-clean-tile" key={tile.key}>
              {tile.screenOn || tile.cameraOn ? (
                <VideoTrackView track={tile.screenTrack || tile.cameraTrack} muted={tile.isLocal} />
              ) : (
                <div className="omide-livekit-clean-avatar">
                  {tile.avatarUrl ? (
                    <img className="omide-livekit-clean-avatar-img" src={tile.avatarUrl} alt="" />
                  ) : (
                    <span>{initials(tile.name)}</span>
                  )}
                </div>
              )}

              {tile.handRaised && (
                <div className="omide-livekit-hand-badge" title="Hand raised">✋</div>
              )}

              <AudioTrackView track={tile.isLocal ? null : tile.microphoneTrack} />

              {tile.micOn && (
                <div className="omide-livekit-clean-eq">
                  <span style={{ width: `${Math.max(8, Math.round(tile.audioLevel * 100))}%` }} />
                </div>
              )}

              <div className="omide-livekit-clean-namebar">
                <strong>{tile.name}</strong>
                <small>
                  {tile.isLocal ? "You" : "Member"} · {tile.screenOn ? "Screen" : tile.micOn ? "Mic on" : "Muted"}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default RealLiveKitRoom;
