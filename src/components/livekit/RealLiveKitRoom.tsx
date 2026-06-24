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
  micAllowed?: boolean;
  forceMicOff?: boolean;
  forceCameraOff?: boolean;
  raisedHands?: Record<string, boolean>;
  onConnectionChange?: (connected: boolean) => void | Promise<void>;
  onMediaStateChange?: (state: { mic: boolean; camera: boolean }) => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
};

type LiveTile = {
  key: string;
  profileId: string;
  identity: string;
  name: string;
  isLocal: boolean;
  cameraOn: boolean;
  micOn: boolean;
  handRaised: boolean;
  cameraTrack: any | null;
  microphoneTrack: any | null;
  audioLevel: number;
};

function parseMetadata(participant: any) {
  try {
    return JSON.parse(participant?.metadata || "{}");
  } catch {
    return {};
  }
}

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

function AudioTrackView({ track, sinkId }: { track: any | null; sinkId?: string }) {
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

  useEffect(() => {
    const element: any = ref.current;
    if (!element || !sinkId || typeof element.setSinkId !== "function") return;

    element.setSinkId(sinkId).catch(() => undefined);
  }, [sinkId]);

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

function tileFromParticipant(participant: any, isLocal: boolean, raisedHands: Record<string, boolean>): LiveTile {
  const publications = getPublications(participant);
  const metadata = parseMetadata(participant);
  const identity = participant?.identity || "";
  const profileId = metadata?.profileId || identity.split(":")[0] || identity;

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

  return {
    key: participant?.sid || identity || participant?.name || (isLocal ? "local" : crypto.randomUUID()),
    profileId,
    identity,
    name: participant?.name || identity || (isLocal ? "You" : "Participant"),
    isLocal,
    cameraOn: Boolean(cameraTrack && !cameraMuted),
    micOn: Boolean(microphoneTrack && !micMuted),
    handRaised: Boolean(raisedHands[profileId] || raisedHands[identity]),
    cameraTrack,
    microphoneTrack,
    audioLevel
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

function getBrowserMode() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return { isIOS, isSafari };
}


function isSafariLikeBrowser() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  return isIOS || isSafari;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function safariMediaPreflight() {
  if (!navigator.mediaDevices?.getUserMedia) return;

  // Safari is much more stable when getUserMedia is initiated from the same
  // user gesture before the WebRTC room starts negotiating.
  let stream: MediaStream | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } as MediaTrackConstraints,
      video: false
    });
  } finally {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }
}

export function RealLiveKitRoom({
  profile,
  admitted,
  meetingId,
  autoStart = false,
  confirmBeforeStart = true,
  micAllowed = true,
  forceMicOff = false,
  forceCameraOff = false,
  raisedHands = {},
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
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [sinkIndex, setSinkIndex] = useState(0);
  const [browserMode] = useState(getBrowserMode());
  const [isSafariMode] = useState(isSafariLikeBrowser());

  const canEnter = Boolean(profile?.status === "approved" && (isHostRole(profile) || admitted));
  const currentSinkId = audioOutputs[sinkIndex]?.deviceId || "";

  function refreshTiles(room?: Room | null) {
    const activeRoom = room || roomRef.current;

    if (!activeRoom) {
      setTiles([]);
      return;
    }

    const nextTiles: LiveTile[] = [
      tileFromParticipant(activeRoom.localParticipant, true, raisedHands),
      ...Array.from(activeRoom.remoteParticipants.values()).map((participant: any) =>
        tileFromParticipant(participant, false, raisedHands)
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

    if (isSafariMode) {
      setStatus("Safari mode: checking microphone permission...");
      try {
        await safariMediaPreflight();
      } catch (permissionError: any) {
        setStatus("Safari permission required");
        setError(permissionError?.message || "Safari blocked microphone permission. Allow microphone/camera for this website, then try again.");
        connectingRef.current = false;
        return;
      }

      await wait(250);
    }

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
        // Safari/iOS mode avoids connection features that can trigger unstable
        // signaling or negotiation on WebKit. Chrome still uses the stronger mode.
        adaptiveStream: !isSafariMode,
        dynacast: !isSafariMode,
        disconnectOnPageLeave: false,
        publishDefaults: {
          simulcast: !isSafariMode,
          videoCodec: isSafariMode ? "h264" : undefined,
          stopMicTrackOnMute: true
        } as any
      } as any);

      roomRef.current = room;
      wireRoom(room);

      const wsUrl = result.wsUrl || liveKitReadyConfig.wsUrl;

      if (isSafariMode && typeof (room as any).prepareConnection === "function") {
        try {
          setStatus("Safari mode: preparing connection...");
          await (room as any).prepareConnection(wsUrl, result.token);
          await wait(300);
        } catch {
          // prepareConnection is only a preflight optimization; continue to real connect
        }
      }

      let lastConnectError: any = null;
      const attempts = isSafariMode ? 3 : 1;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          setStatus(isSafariMode ? `Safari mode: connecting attempt ${attempt}/${attempts}...` : "Connecting to LiveKit room...");
          await room.connect(wsUrl, result.token, {
            autoSubscribe: true,
            rtcConfig: isSafariMode
              ? {
                  iceCandidatePoolSize: 0,
                  bundlePolicy: "balanced",
                  rtcpMuxPolicy: "require"
                }
              : undefined
          } as any);
          lastConnectError = null;
          break;
        } catch (connectError: any) {
          lastConnectError = connectError;
          if (!isSafariMode || attempt === attempts) break;
          try {
            room.disconnect();
          } catch {
            // ignore
          }
          await wait(900 * attempt);
        }
      }

      if (lastConnectError) {
        throw lastConnectError;
      }

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

      const safariHint = browserMode.isIOS || browserMode.isSafari
        ? " Safari/iOS: close other OmideNo7 tabs, allow microphone/camera for this site, disable iCloud Private Relay/VPN for this test, then try again."
        : "";

      setError(`${err?.message || "Could not connect to LiveKit room."}${safariHint}`);
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

  async function setMicEnabled(next: boolean) {
    const room = roomRef.current;
    if (!room || !connected) {
      setError("Enter the live room first.");
      return;
    }

    if (next && !micAllowed && !isHostRole(profile)) {
      setError("The host has not allowed your microphone yet.");
      return;
    }

    setMicOn(next);

    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      refreshTiles(room);
      await onMediaStateChange?.({ mic: next, camera: cameraOn });
    } catch (err: any) {
      setMicOn(!next);
      setError(err?.message || "Could not change microphone. Check browser mic permission.");
    }
  }

  async function setCameraEnabled(next: boolean) {
    const room = roomRef.current;
    if (!room || !connected) {
      setError("Enter the live room first.");
      return;
    }

    setCameraOn(next);

    try {
      await room.localParticipant.setCameraEnabled(next);
      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 650);
      await onMediaStateChange?.({ mic: micOn, camera: next });
    } catch (err: any) {
      setCameraOn(!next);
      setError(err?.message || "Could not change camera. Check browser camera permission.");
    }
  }

  function cycleAudioOutput() {
    if (audioOutputs.length <= 1) {
      const unsupported = typeof HTMLMediaElement !== "undefined" &&
        !("setSinkId" in HTMLMediaElement.prototype);
      setError(unsupported ? "This browser controls speaker/earpiece from the system. Audio output switching is not supported here." : "No extra audio output device found.");
      return;
    }

    setSinkIndex((current) => (current + 1) % audioOutputs.length);
  }

  useEffect(() => {
    async function loadOutputs() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioOutputs(devices.filter((device) => device.kind === "audiooutput"));
      } catch {
        // ignore unsupported browser
      }
    }

    void loadOutputs();
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    if (needsStart) return;
    if (autoTriedRef.current) return;
    if (!canEnter) return;

    autoTriedRef.current = true;
    const timer = window.setTimeout(() => void connect(true), 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, needsStart, canEnter, meetingId]);

  useEffect(() => {
    if (forceMicOff && micOn) {
      void setMicEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceMicOff, micOn]);

  useEffect(() => {
    if (forceCameraOff && cameraOn) {
      void setCameraEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceCameraOff, cameraOn]);

  useEffect(() => {
    const timer = window.setInterval(() => refreshTiles(), 700);
    return () => window.clearInterval(timer);
  }, [raisedHands]);

  useEffect(() => {
    function handleLiveKitControl(event: Event) {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "mic") void setMicEnabled(!micOn);
      if (action === "camera") void setCameraEnabled(!cameraOn);
      if (action === "speaker") cycleAudioOutput();
      if (action === "leave") void disconnect(true);
      if (action === "force-disconnect") void disconnect(false);
      if (action === "force-mic-off") void setMicEnabled(false);
      if (action === "force-camera-off") void setCameraEnabled(false);
    }

    window.addEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
    return () => window.removeEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
  }, [micOn, cameraOn, connected, audioOutputs, sinkIndex, micAllowed]);

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

        .omide-hand-badge {
          position: absolute !important;
          left: 10px !important;
          top: 10px !important;
          z-index: 14 !important;
          width: 34px !important;
          height: 34px !important;
          border-radius: 999px !important;
          display: grid !important;
          place-items: center !important;
          background: rgba(19,191,84,.95) !important;
          color: #fff !important;
          box-shadow: 0 10px 28px rgba(0,0,0,.26) !important;
          font-size: 1.05rem !important;
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

          .omide-livekit-clean-avatar span {
            width: 52px !important;
            height: 52px !important;
            border-radius: 18px !important;
            font-size: 1.2rem !important;
          }

          .omide-hand-badge {
            left: 7px !important;
            top: 7px !important;
            width: 28px !important;
            height: 28px !important;
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

          <button type="button" onClick={() => void setMicEnabled(!micOn)} disabled={!connected}>
            {micOn ? "Mute" : "Unmute"}
          </button>

          <button type="button" onClick={() => void setCameraEnabled(!cameraOn)} disabled={!connected}>
            {cameraOn ? "Camera off" : "Camera on"}
          </button>

          <button type="button" onClick={cycleAudioOutput}>
            Speaker
          </button>

          <button className="danger" type="button" onClick={() => void disconnect(true)}>
            Leave
          </button>
        </div>
      </div>

      <div className="omide-livekit-clean-status">{status}</div>

      {(browserMode.isIOS || browserMode.isSafari) && (
        <div className="omide-livekit-clean-notice">
          Safari/iOS compatibility mode is active. Microphone permission is checked before LiveKit connects.
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
              {tile.handRaised && <div className="omide-hand-badge">✋</div>}

              {tile.cameraOn ? (
                <VideoTrackView track={tile.cameraTrack} muted={tile.isLocal} />
              ) : (
                <div className="omide-livekit-clean-avatar">
                  <span>{initials(tile.name)}</span>
                </div>
              )}

              <AudioTrackView track={tile.isLocal ? null : tile.microphoneTrack} sinkId={currentSinkId} />

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
