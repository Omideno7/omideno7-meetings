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
  onConnectionChange?: (connected: boolean) => void;
  onMediaStateChange?: (state: { mic: boolean; camera: boolean }) => void | Promise<void>;
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

  return <audio ref={ref} autoPlay />;
}

function getPublications(participant: any) {
  const publications = participant?.trackPublications || participant?.tracks || new Map();
  return Array.from(publications.values()) as any[];
}

function tileFromParticipant(participant: any, isLocal: boolean): LiveTile {
  const publications = getPublications(participant);
  const cameraPublication = publications.find((pub) => pub.source === Track.Source.Camera);
  const micPublication = publications.find((pub) => pub.source === Track.Source.Microphone);
  const audioLevel = Number(participant?.audioLevel || 0);
  const speaking = Boolean(participant?.isSpeaking || audioLevel > 0.05);

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
  onMediaStateChange
}: Props) {
  const [status, setStatus] = useState("Ready.");
  const [tokenData, setTokenData] = useState<Extract<LiveKitTokenResponse, { ok: true }> | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [tiles, setTiles] = useState<LiveTile[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [confirmed, setConfirmed] = useState(!confirmBeforeStart);

  const connected = Boolean(room && tokenData);
  const remoteAudioTiles = useMemo(() => tiles.filter((tile) => !tile.isLocal && tile.microphoneTrack), [tiles]);

  function refreshTiles(nextRoom = room) {
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
    window.setTimeout(() => refreshTiles(nextRoom || room), 150);
  }

  async function connectRealRoom() {
    if (connecting || connected) return;
    if (!admitted) {
      setStatus("Waiting for host admission.");
      return;
    }

    setConnecting(true);
    setStatus("Opening secure live meeting...");

    const result = await liveKitTokenService.requestToken({ meetingId, profile, admitted });
    if (!result.ok) {
      setConnecting(false);
      setStatus(result.message || `Cannot enter live meeting: ${result.reason}`);
      onConnectionChange?.(false);
      return;
    }

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
        setRoom(null);
        setTokenData(null);
        setTiles([]);
        setCameraEnabled(false);
        setMicEnabled(false);
        onConnectionChange?.(false);
        void onMediaStateChange?.({ mic: false, camera: false });
      });

    try {
      await nextRoom.connect(result.wsUrl || liveKitReadyConfig.wsUrl, result.token, {
        autoSubscribe: true
      });

      setRoom(nextRoom);
      setTokenData(result);
      onConnectionChange?.(true);
      setStatus("Live meeting open.");

      // Important: default mic/camera OFF. User turns them on by consent.
      try {
        await nextRoom.localParticipant.setMicrophoneEnabled(false);
        await nextRoom.localParticipant.setCameraEnabled(false);
      } catch {
        // ignore default-off errors
      }

      await publishMediaState(nextRoom, false, false);
      window.setTimeout(() => refreshTiles(nextRoom), 250);
      window.setTimeout(() => refreshTiles(nextRoom), 1200);
    } catch (error: any) {
      await nextRoom.disconnect();
      setStatus(error?.message || "Could not establish live meeting connection.");
      onConnectionChange?.(false);
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectRealRoom() {
    if (room) {
      await room.disconnect();
    }
    setRoom(null);
    setTokenData(null);
    setTiles([]);
    setCameraEnabled(false);
    setMicEnabled(false);
    setConfirmed(!confirmBeforeStart);
    onConnectionChange?.(false);
    await onMediaStateChange?.({ mic: false, camera: false });
    setStatus("You left the live meeting.");
  }

  async function toggleCamera() {
    if (!room) return;
    const next = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    await publishMediaState(room, micEnabled, next);
  }

  async function toggleMic() {
    if (!room) return;
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    await publishMediaState(room, next, cameraEnabled);
  }

  useEffect(() => {
    if (autoStart && admitted && confirmed && !connected && !connecting) {
      void connectRealRoom();
    }
  }, [autoStart, admitted, confirmed, connected, connecting]);

  useEffect(() => {
    if (!room) return;
    const timer = window.setInterval(() => refreshTiles(room), 300);
    return () => window.clearInterval(timer);
  }, [room]);

  useEffect(() => {
    function handleLiveKitControl(event: Event) {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "mic") void toggleMic();
      if (action === "camera") void toggleCamera();
      if (action === "leave") void disconnectRealRoom();
    }

    window.addEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
    return () => window.removeEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
  }, [room, micEnabled, cameraEnabled]);

  useEffect(() => {
    return () => {
      room?.disconnect();
    };
  }, [room]);

  if (!connected && confirmBeforeStart && !confirmed) {
    return (
      <section className="omide-livekit-stage idle">
        <div className="omide-livekit-head">
          <div>
            <strong>Enter live meeting?</strong>
            <span>Open the active OmideNo7 room now.</span>
          </div>
          <div className="omide-livekit-actions">
            <button onClick={() => setConfirmed(true)}>Enter now</button>
          </div>
        </div>
        <p className="omide-livekit-status">Camera and microphone will stay off until you turn them on.</p>
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
            <button onClick={connectRealRoom} disabled={connecting || !admitted}>
              {connecting ? "Opening..." : "Enter"}
            </button>
          ) : (
            <>
              <button aria-label="Toggle microphone" onClick={toggleMic} className={micEnabled ? "active mic-action" : "mic-action"}>{micEnabled ? "🎙" : "🔇"}</button>
              <button aria-label="Toggle camera" onClick={toggleCamera} className={cameraEnabled ? "active cam-action" : "cam-action"}>{cameraEnabled ? "📷" : "🚫"}</button>
              <button className="danger" onClick={disconnectRealRoom}>Leave</button>
            </>
          )}
        </div>
      </div>

      {!admitted && (
        <div className="omide-livekit-warning">
          Waiting for host admission.
        </div>
      )}

      <p className="omide-livekit-status">{status}</p>

      {connected && (
        <div className="custom-livekit-grid">
          {tiles.map((tile) => {
            const level = Math.max(0.05, Math.min(tile.audioLevel || 0, 1));
            return (
              <article
                key={tile.key}
                className={`custom-livekit-tile ${tile.cameraOn ? "video-on" : "video-off"} ${tile.micOn ? "mic-active" : "mic-muted"} ${tile.speaking ? "speaking-now" : ""}`}
                style={{ ["--audio-level" as any]: String(level) }}
              >
                {tile.cameraOn ? (
                  <VideoTrackView track={tile.cameraTrack} muted={tile.isLocal} />
                ) : (
                  <div className="custom-livekit-avatar">
                    <span>{tile.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}

                <div className="live-audio-ring" aria-hidden="true">
                  <i></i><i></i><i></i><i></i>
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
