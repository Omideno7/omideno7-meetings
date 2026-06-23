import { useEffect, useMemo, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import type { UserProfile } from "../../types/roles";
import { liveKitTokenService, type LiveKitTokenResponse } from "../../services/liveKitTokenService";
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
  cameraTrack: any | null;
  microphoneTrack: any | null;
  cameraOn: boolean;
  micOn: boolean;
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
  return <video ref={ref} autoPlay playsInline muted={muted} className="custom-livekit-video" />;
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
  const publications = participant?.trackPublications || participant?.tracks || new Map();
  return Array.from(publications.values()) as any[];
}

function tileFromParticipant(participant: any, isLocal: boolean): LiveTile {
  const publications = getPublications(participant);
  const cameraPublication = publications.find((pub) => pub.source === Track.Source.Camera);
  const micPublication = publications.find((pub) => pub.source === Track.Source.Microphone);
  const audioLevel = Math.max(0, Math.min(Number(participant?.audioLevel || 0), 1));
  const speaking = Boolean(participant?.isSpeaking || audioLevel > 0.055);

  return {
    key: participant.identity || participant.sid || participant.name,
    name: participant.name || (isLocal ? "You" : participant.identity || "Participant"),
    isLocal,
    cameraTrack: cameraPublication?.track || null,
    microphoneTrack: micPublication?.track || null,
    cameraOn: Boolean(cameraPublication?.track && !cameraPublication?.isMuted),
    micOn: Boolean(micPublication?.track && !micPublication?.isMuted),
    audioLevel,
    speaking
  };
}

export function RealLiveKitRoom({
  profile,
  admitted,
  meetingId,
  autoStart = false,
  confirmBeforeStart = false,
  onConnectionChange,
  onMediaStateChange,
  onLeave
}: Props) {
  const [status, setStatus] = useState("Ready.");
  const [tokenData, setTokenData] = useState<Extract<LiveKitTokenResponse, { ok: true }> | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [tiles, setTiles] = useState<LiveTile[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [confirmed, setConfirmed] = useState(!confirmBeforeStart);
  const [failed, setFailed] = useState(false);
  const autoTriedRef = useRef(false);
  const roomRef = useRef<Room | null>(null);

  const connected = Boolean(room && tokenData);
  const remoteAudioTiles = useMemo(() => tiles.filter((tile) => !tile.isLocal && tile.microphoneTrack), [tiles]);

  function refreshTiles(nextRoom = roomRef.current) {
    if (!nextRoom) {
      setTiles([]);
      return;
    }

    const nextTiles: LiveTile[] = [];
    if (nextRoom.localParticipant) {
      nextTiles.push(tileFromParticipant(nextRoom.localParticipant, true));
    }

    nextRoom.remoteParticipants.forEach((participant: any) => {
      nextTiles.push(tileFromParticipant(participant, false));
    });

    setTiles(nextTiles);
  }

  async function publishMediaState(nextRoom: Room | null, mic: boolean, camera: boolean) {
    setMicEnabled(mic);
    setCameraEnabled(camera);
    await onMediaStateChange?.({ mic, camera });
    window.setTimeout(() => refreshTiles(nextRoom || roomRef.current), 150);
    window.setTimeout(() => refreshTiles(nextRoom || roomRef.current), 700);
  }

  async function connectRealRoom(manual = false) {
    if (connecting || connected) return;
    if (!admitted) {
      setStatus("Waiting for host admission.");
      return;
    }

    if (failed && !manual) return;

    setFailed(false);
    setConnecting(true);
    setStatus("Requesting secure LiveKit token...");

    const result = await liveKitTokenService.requestToken({ meetingId, profile, admitted });
    if (!result.ok) {
      setConnecting(false);
      setFailed(true);
      setStatus(result.message || `Cannot enter live meeting: ${result.reason}`);
      await onConnectionChange?.(false);
      return;
    }

    setStatus("Token received. Connecting to LiveKit room...");

    const nextRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      stopLocalTrackOnUnpublish: true
    });

    const refresh = () => refreshTiles(nextRoom);

    nextRoom
      .on(RoomEvent.ParticipantConnected, refresh)
      .on(RoomEvent.ParticipantDisconnected, refresh)
      .on(RoomEvent.TrackSubscribed, refresh)
      .on(RoomEvent.TrackUnsubscribed, refresh)
      .on(RoomEvent.TrackMuted, refresh)
      .on(RoomEvent.TrackUnmuted, refresh)
      .on(RoomEvent.LocalTrackPublished, refresh)
      .on(RoomEvent.LocalTrackUnpublished, refresh)
      .on(RoomEvent.Disconnected, () => {
        setStatus("Disconnected.");
        roomRef.current = null;
        setRoom(null);
        setTokenData(null);
        setTiles([]);
        setCameraEnabled(false);
        setMicEnabled(false);
        void onConnectionChange?.(false);
        void onMediaStateChange?.({ mic: false, camera: false });
      });

    try {
      await nextRoom.connect(result.wsUrl || liveKitReadyConfig.wsUrl, result.token, {
        autoSubscribe: true
      });

      roomRef.current = nextRoom;
      setRoom(nextRoom);
      setTokenData(result);
      await onConnectionChange?.(true);
      setStatus("Live meeting open.");

      try {
        await nextRoom.localParticipant.setMicrophoneEnabled(false);
        await nextRoom.localParticipant.setCameraEnabled(false);
      } catch {
        // keep default off
      }

      await publishMediaState(nextRoom, false, false);
      window.setTimeout(() => refreshTiles(nextRoom), 250);
      window.setTimeout(() => refreshTiles(nextRoom), 1200);
    } catch (error: any) {
      await nextRoom.disconnect();
      setFailed(true);
      setStatus(error?.message || "Could not establish LiveKit room connection.");
      await onConnectionChange?.(false);
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectRealRoom(markLeave = true) {
    if (roomRef.current) {
      await roomRef.current.disconnect();
    }

    roomRef.current = null;
    setRoom(null);
    setTokenData(null);
    setTiles([]);
    setCameraEnabled(false);
    setMicEnabled(false);
    setConfirmed(!confirmBeforeStart);
    await onConnectionChange?.(false);
    await onMediaStateChange?.({ mic: false, camera: false });

    if (markLeave) await onLeave?.();
    setStatus("You left the live meeting.");
  }

  async function toggleCamera() {
    const activeRoom = roomRef.current;
    if (!activeRoom) {
      setStatus("Live room is not connected yet.");
      return;
    }

    const next = !cameraEnabled;
    try {
      await activeRoom.localParticipant.setCameraEnabled(next);
      await publishMediaState(activeRoom, micEnabled, next);
      setStatus(next ? "Camera on." : "Camera off.");
    } catch (error: any) {
      setStatus(error?.message || "Camera permission was blocked by the browser.");
    }
  }

  async function toggleMic() {
    const activeRoom = roomRef.current;
    if (!activeRoom) {
      setStatus("Live room is not connected yet.");
      return;
    }

    const next = !micEnabled;
    try {
      await activeRoom.localParticipant.setMicrophoneEnabled(next);
      await publishMediaState(activeRoom, next, cameraEnabled);
      setStatus(next ? "Microphone on." : "Microphone muted.");
    } catch (error: any) {
      setStatus(error?.message || "Microphone permission was blocked by the browser.");
    }
  }

  useEffect(() => {
    if (autoStart && admitted && confirmed && !connected && !connecting && !failed && !autoTriedRef.current) {
      autoTriedRef.current = true;
      void connectRealRoom(false);
    }
  }, [autoStart, admitted, confirmed, connected, connecting, failed]);

  useEffect(() => {
    const activeRoom = roomRef.current;
    if (!activeRoom) return;
    const timer = window.setInterval(() => refreshTiles(activeRoom), 250);
    return () => window.clearInterval(timer);
  }, [room]);

  useEffect(() => {
    function handleLiveKitControl(event: Event) {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "mic") void toggleMic();
      if (action === "camera") void toggleCamera();
      if (action === "leave") void disconnectRealRoom(true);
      if (action === "force-disconnect") void disconnectRealRoom(false);
    }

    window.addEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
    return () => window.removeEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
  }, [micEnabled, cameraEnabled]);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
    };
  }, []);

  if (!connected && confirmBeforeStart && !confirmed) {
    return (
      <section className="omide-livekit-stage idle">
        <div className="omide-livekit-head">
          <div>
            <strong>Enter live meeting?</strong>
            <span>Open the active OmideNo7 room now.</span>
          </div>
          <div className="omide-livekit-actions">
            <button onClick={() => { setConfirmed(true); window.setTimeout(() => void connectRealRoom(true), 0); }}>Enter now</button>
          </div>
        </div>
        <p className="omide-livekit-status">Camera and microphone stay off until you turn them on.</p>
      </section>
    );
  }

  return (
    <section className={`omide-livekit-stage ${connected ? "connected" : "idle"}`}>
      <div className="omide-livekit-head">
        <div>
          <strong>OmideNo7 Live Meeting</strong>
          <span>{connected ? "Live room is active" : "Members enter after host admission"}</span>
        </div>

        <div className="omide-livekit-actions compact-media-actions">
          {!connected ? (
            <>
              <button onClick={() => connectRealRoom(true)} disabled={connecting || !admitted}>
                {connecting ? "Opening..." : failed ? "Try again" : "Enter"}
              </button>
              {failed && <a className="debug-link" href="/api/livekit/debug" target="_blank" rel="noreferrer">Debug</a>}
            </>
          ) : (
            <>
              <button aria-label="Toggle microphone" onClick={toggleMic} className={micEnabled ? "active mic-action" : "mic-action"}>{micEnabled ? "🎙" : "🔇"}</button>
              <button aria-label="Toggle camera" onClick={toggleCamera} className={cameraEnabled ? "active cam-action" : "cam-action"}>{cameraEnabled ? "📷" : "🚫"}</button>
              <button className="danger" onClick={() => disconnectRealRoom(true)}>Leave</button>
            </>
          )}
        </div>
      </div>

      {!admitted && <div className="omide-livekit-warning">Waiting for host admission.</div>}
      <p className={`omide-livekit-status ${failed ? "error" : ""}`}>{status}</p>

      {connected && (
        <div className="custom-livekit-grid">
          {tiles.map((tile) => {
            const level = Math.max(0, Math.min(tile.audioLevel || 0, 1));
            const levelForCss = tile.speaking ? String(Math.max(level, 0.12)) : "0";
            return (
              <article
                key={tile.key}
                className={`custom-livekit-tile ${tile.cameraOn ? "video-on" : "video-off"} ${tile.micOn ? "mic-active" : "mic-muted"} ${tile.speaking ? "speaking-now" : ""}`}
                style={{ ["--audio-level" as any]: levelForCss }}
              >
                {tile.cameraOn ? (
                  <VideoTrackView track={tile.cameraTrack} muted={tile.isLocal} />
                ) : (
                  <div className="custom-livekit-avatar">
                    <span>{tile.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}

                <div className="live-audio-ring real-eq" aria-hidden="true">
                  <i></i><i></i><i></i><i></i><i></i>
                </div>

                <div className="custom-livekit-namebar">
                  <strong>{tile.isLocal ? `${tile.name} (You)` : tile.name}</strong>
                  <small>{tile.micOn ? "🎙" : "🔇"} · {tile.cameraOn ? "📷" : "🚫"}</small>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="custom-livekit-audio">
        {remoteAudioTiles.map((tile) => (
          <AudioTrackView key={`${tile.key}-audio`} track={tile.microphoneTrack} />
        ))}
      </div>
    </section>
  );
}
