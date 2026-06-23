import { useEffect, useMemo, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import type { UserProfile } from "../../types/roles";
import { liveKitTokenService, type LiveKitTokenResponse } from "../../services/liveKitTokenService";
import { liveKitReadyConfig } from "../../config/liveKitReady";

type Props = {
  profile: UserProfile | null;
  admitted: boolean;
  meetingId: string;
  onConnectionChange?: (connected: boolean) => void;
};

type LiveTile = {
  key: string;
  name: string;
  role?: string;
  isLocal: boolean;
  cameraTrack: any | null;
  microphoneTrack: any | null;
  cameraOn: boolean;
  micOn: boolean;
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

  return {
    key: participant.identity || participant.sid || participant.name,
    name: participant.name || (isLocal ? "You" : participant.identity || "Participant"),
    isLocal,
    cameraTrack: cameraPublication?.track || null,
    microphoneTrack: micPublication?.track || null,
    cameraOn: Boolean(cameraPublication?.track && !cameraPublication?.isMuted),
    micOn: Boolean(micPublication?.track && !micPublication?.isMuted)
  };
}

export function RealLiveKitRoom({ profile, admitted, meetingId, onConnectionChange }: Props) {
  const [status, setStatus] = useState("Ready to open live meeting.");
  const [tokenData, setTokenData] = useState<Extract<LiveKitTokenResponse, { ok: true }> | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [tiles, setTiles] = useState<LiveTile[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);

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

  async function connectRealRoom() {
    if (connecting || connected) return;

    setConnecting(true);
    setStatus("Opening secure OmideNo7 live meeting...");

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
        setStatus("Live meeting disconnected.");
        setRoom(null);
        setTokenData(null);
        setTiles([]);
        setCameraEnabled(false);
        setMicEnabled(false);
        onConnectionChange?.(false);
      });

    try {
      await nextRoom.connect(result.wsUrl || liveKitReadyConfig.wsUrl, result.token, {
        autoSubscribe: true
      });

      setRoom(nextRoom);
      setTokenData(result);
      onConnectionChange?.(true);
      setStatus("Live meeting is open. Camera and microphone are ready.");

      try {
        await nextRoom.localParticipant.setMicrophoneEnabled(true);
        setMicEnabled(true);
      } catch (error: any) {
        setStatus(`Microphone permission needed: ${error?.message || "enable microphone from browser"}`);
      }

      try {
        await nextRoom.localParticipant.setCameraEnabled(true);
        setCameraEnabled(true);
      } catch (error: any) {
        setStatus(`Camera permission needed: ${error?.message || "enable camera from browser"}`);
      }

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
    onConnectionChange?.(false);
    setStatus("You left the live meeting.");
  }

  async function toggleCamera() {
    if (!room) return;
    const next = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setCameraEnabled(next);
    window.setTimeout(() => refreshTiles(room), 250);
  }

  async function toggleMic() {
    if (!room) return;
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
    window.setTimeout(() => refreshTiles(room), 250);
  }

  useEffect(() => {
    return () => {
      room?.disconnect();
    };
  }, [room]);

  return (
    <section className={`omide-livekit-stage ${connected ? "connected" : "idle"}`}>
      <div className="omide-livekit-head">
        <div>
          <strong>OmideNo7 Live Meeting</strong>
          <span>{connected ? "Live video tiles are active" : "Host opens the room, members join after admission"}</span>
        </div>

        <div className="omide-livekit-actions">
          {!connected ? (
            <button onClick={connectRealRoom} disabled={connecting || !admitted}>
              {connecting ? "Opening..." : "Join Live Meeting"}
            </button>
          ) : (
            <>
              <button onClick={toggleMic} className={micEnabled ? "active" : ""}>{micEnabled ? "Mute mic" : "Unmute mic"}</button>
              <button onClick={toggleCamera} className={cameraEnabled ? "active" : ""}>{cameraEnabled ? "Camera off" : "Camera on"}</button>
              <button className="danger" onClick={disconnectRealRoom}>Leave live</button>
            </>
          )}
        </div>
      </div>

      {!admitted && (
        <div className="omide-livekit-warning">
          You must be admitted by the host before entering the live meeting.
        </div>
      )}

      <p className="omide-livekit-status">{status}</p>

      {connected && (
        <div className="custom-livekit-grid">
          {tiles.map((tile) => (
            <article key={tile.key} className={`custom-livekit-tile ${tile.cameraOn ? "video-on" : "video-off"}`}>
              {tile.cameraOn ? (
                <VideoTrackView track={tile.cameraTrack} muted={tile.isLocal} />
              ) : (
                <div className="custom-livekit-avatar">
                  <span>{tile.name.slice(0, 1).toUpperCase()}</span>
                </div>
              )}
              <div className="custom-livekit-namebar">
                <strong>{tile.isLocal ? `${tile.name} (You)` : tile.name}</strong>
                <small>{tile.micOn ? "Mic on" : "Muted"} · {tile.cameraOn ? "Camera on" : "Camera off"}</small>
              </div>
            </article>
          ))}
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
