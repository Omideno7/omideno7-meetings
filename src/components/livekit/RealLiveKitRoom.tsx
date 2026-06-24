import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import type { UserProfile } from "../../types/roles";
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
};

type LiveTile = {
  key: string;
  name: string;
  isLocal: boolean;
  cameraOn: boolean;
  micOn: boolean;
  cameraTrack: any | null;
  microphoneTrack: any | null;
  audioLevel: number;
  speaking: boolean;
};

function VideoTrackView({ track, muted }: { track: any | null; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !track) return;

    track.attach(element);

    return () => {
      try {
        track.detach(element);
      } catch {
        // ignore detach errors
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

    track.attach(element);

    return () => {
      try {
        track.detach(element);
      } catch {
        // ignore detach errors
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
  return publications.find((publication: any) => {
    return publication?.source === source || publication?.kind === kind;
  });
}

function tileFromParticipant(participant: any, isLocal: boolean): LiveTile {
  const publications = getPublications(participant);

  const cameraPublication = pickPublication(publications, Track.Source.Camera, Track.Kind.Video);
  const micPublication = pickPublication(publications, Track.Source.Microphone, Track.Kind.Audio);

  const cameraTrack =
    cameraPublication?.track ||
    cameraPublication?.videoTrack ||
    null;

  const microphoneTrack =
    micPublication?.track ||
    micPublication?.audioTrack ||
    null;

  const cameraMuted =
    Boolean(cameraPublication?.isMuted) ||
    Boolean(cameraPublication?.muted) ||
    Boolean(cameraTrack?.isMuted);

  const micMuted =
    Boolean(micPublication?.isMuted) ||
    Boolean(micPublication?.muted) ||
    Boolean(microphoneTrack?.isMuted);

  const audioLevel = Math.max(0, Math.min(Number(participant?.audioLevel || 0), 1));
  const speaking = Boolean(participant?.isSpeaking) || audioLevel > 0.08;

  return {
    key: participant?.sid || participant?.identity || participant?.name || (isLocal ? "local" : crypto.randomUUID()),
    name: participant?.name || participant?.identity || (isLocal ? "You" : "Participant"),
    isLocal,
    cameraOn: Boolean(cameraTrack && !cameraMuted),
    micOn: Boolean(microphoneTrack && !micMuted),
    cameraTrack,
    microphoneTrack,
    audioLevel,
    speaking
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
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

export function RealLiveKitRoom({
  profile,
  admitted,
  meetingId,
  autoStart = true,
  confirmBeforeStart = false,
  onConnectionChange,
  onMediaStateChange,
  onLeave
}: Props) {
  const roomRef = useRef<Room | null>(null);
  const connectingRef = useRef(false);
  const autoTriedRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [tiles, setTiles] = useState<LiveTile[]>([]);
  const [needsStart, setNeedsStart] = useState(Boolean(confirmBeforeStart));

  const canEnter = Boolean(profile?.status === "approved" && (isHostRole(profile) || admitted));

  function refreshTiles(room?: Room | null) {
    const activeRoom = room || roomRef.current;

    if (!activeRoom) {
      setTiles([]);
      return;
    }

    const nextTiles: LiveTile[] = [
      tileFromParticipant(activeRoom.localParticipant, true),
      ...Array.from(activeRoom.remoteParticipants.values()).map((participant: any) =>
        tileFromParticipant(participant, false)
      )
    ];

    setTiles(nextTiles);
  }

  async function connect() {
    if (connectingRef.current || connected) return;

    if (!canEnter) {
      setError("Members must wait for host admission.");
      setStatus("Waiting Room");
      return;
    }

    if (needsStart) {
      setStatus("Ready to start");
      return;
    }

    connectingRef.current = true;
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

      setStatus("Connecting to LiveKit room...");

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true
      });

      roomRef.current = room;

      const update = () => refreshTiles(room);

      room.on(RoomEvent.Connected, async () => {
        setConnected(true);
        setStatus("Connected");
        setError("");
        refreshTiles(room);
        await onConnectionChange?.(true);

        try {
          await room.localParticipant.setMicrophoneEnabled(false);
          await room.localParticipant.setCameraEnabled(false);
        } catch {
          // keep default off
        }

        setMicOn(false);
        setCameraOn(false);
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

      await withTimeout(
        room.connect(result.wsUrl || liveKitReadyConfig.wsUrl, result.token, {
          autoSubscribe: true
        }),
        35000,
        "Could not establish signal connection. Safari may block WebRTC/WebSocket. Try Chrome or refresh and sign in again."
      );

      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 500);
      window.setTimeout(() => refreshTiles(room), 1500);
    } catch (err: any) {
      console.error("LiveKit connection error:", err);
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
      setTiles([]);
      setStatus("Left meeting");
      await onMediaStateChange?.({ mic: false, camera: false });
      await onConnectionChange?.(false);
      if (markLeave) await onLeave?.();
    }
  }

  async function toggleMic() {
    const room = roomRef.current;
    if (!room || !connected) return;

    const next = !micOn;
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

  async function toggleCamera() {
    const room = roomRef.current;
    if (!room || !connected) return;

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

  useEffect(() => {
    if (!autoStart) return;
    if (needsStart) return;
    if (autoTriedRef.current) return;
    if (!canEnter) return;

    autoTriedRef.current = true;
    void connect();

    return () => {
      const room = roomRef.current;
      if (room) {
        room.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, needsStart, canEnter, meetingId]);

  useEffect(() => {
    const timer = window.setInterval(() => refreshTiles(), 700);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleLiveKitControl(event: Event) {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "mic") void toggleMic();
      if (action === "camera") void toggleCamera();
      if (action === "leave") void disconnect(true);
      if (action === "force-disconnect") void disconnect(false);
    }

    window.addEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
    return () => window.removeEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
  }, [micOn, cameraOn, connected]);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
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
          min-height: 58vh !important;
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

        .omide-livekit-clean-status {
          width: 100% !important;
          border-radius: 16px !important;
          padding: 9px 12px !important;
          background: rgba(255,255,255,.12) !important;
          color: #fff !important;
          font-weight: 700 !important;
          font-size: .82rem !important;
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
          min-height: 320px !important;
          max-height: 72vh !important;
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
          max-height: 360px !important;
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

        .omide-livekit-clean-avatar span {
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
          min-height: 260px !important;
          border-radius: 20px !important;
          display: grid !important;
          place-items: center !important;
          background: rgba(2,6,23,.45) !important;
          color: rgba(255,255,255,.86) !important;
          font-weight: 800 !important;
        }

        @media (max-width: 740px) {
          .omide-livekit-clean {
            padding: 8px !important;
            border-radius: 18px !important;
            min-height: 48vh !important;
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
            min-height: 240px !important;
            max-height: 56vh !important;
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

          .omide-livekit-clean-avatar span {
            width: 52px !important;
            height: 52px !important;
            border-radius: 18px !important;
            font-size: 1.2rem !important;
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
              onClick={() => {
                setNeedsStart(false);
                void connect();
              }}
              disabled={!canEnter}
            >
              {needsStart ? "Start live room" : "Enter live"}
            </button>
          )}

          <button type="button" onClick={toggleMic} disabled={!connected}>
            {micOn ? "Mute" : "Unmute"}
          </button>

          <button type="button" onClick={toggleCamera} disabled={!connected}>
            {cameraOn ? "Camera off" : "Camera on"}
          </button>

          <button className="danger" type="button" onClick={() => void disconnect(true)}>
            Leave
          </button>
        </div>
      </div>

      <div className="omide-livekit-clean-status">{status}</div>

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
              {tile.cameraOn ? (
                <VideoTrackView track={tile.cameraTrack} muted={tile.isLocal} />
              ) : (
                <div className="omide-livekit-clean-avatar">
                  <span>{initials(tile.name)}</span>
                </div>
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
                  {tile.isLocal ? "You" : "Member"} · {tile.micOn ? "Mic on" : "Muted"}
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
