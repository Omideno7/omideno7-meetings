import { useEffect, useRef, useState } from "react";
import { createLocalAudioTrack, Room, RoomEvent, Track } from "livekit-client";
import type { UserProfile } from "../../types/roles";
import type { RoomParticipant } from "../../services/meetingRoomService";
import { liveKitTokenService } from "../../services/liveKitTokenService";
import { liveKitReadyConfig } from "../../config/liveKitReady";
import {
  buildOmideAudioConstraints,
  buildOmideVideoConstraints,
  loadOmideMediaPreferences,
  saveOmideMediaPreferences
} from "../../utils/mediaPreferences";

type Props = {
  profile: UserProfile | null;
  admitted: boolean;
  meetingId: string;
  autoStart?: boolean;
  confirmBeforeStart?: boolean;
  onConnectionChange?: (connected: boolean) => void | Promise<void>;
  onMediaStateChange?: (state: { mic: boolean; camera: boolean }) => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
  onStatusChange?: (state: { status: string; error: string; connected: boolean }) => void | Promise<void>;
  participants?: RoomParticipant[];
  localHandRaised?: boolean;
  enterSignal?: number;
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
  screenAudioTrack: any | null;
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

function AudioTrackView({ track, sinkId }: { track: any | null; sinkId?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !track) return;

    try {
      element.muted = false;
      element.volume = 1;
      track.attach(element);
      void element.play?.().catch(() => undefined);
      window.setTimeout(() => void element.play?.().catch(() => undefined), 250);
      window.setTimeout(() => void element.play?.().catch(() => undefined), 900);
      window.setTimeout(() => void element.play?.().catch(() => undefined), 1800);
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
    const element = ref.current as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
    if (!element || !sinkId || !element.setSinkId) return;
    void element.setSinkId(sinkId).catch(() => undefined);
  }, [sinkId, track]);

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

function pickExactSource(publications: any[], source: any) {
  return publications.find((publication: any) => publication?.source === source);
}

function safeMetadata(participant: any) {
  try {
    return JSON.parse(participant?.metadata || "{}") as { profileId?: string; avatarUrl?: string; role?: string };
  } catch {
    return {} as { profileId?: string; avatarUrl?: string; role?: string };
  }
}

function tileFromParticipant(participant: any, isLocal: boolean, participantRows: RoomParticipant[] = [], localProfile?: UserProfile | null, localHandRaised = false): LiveTile {
  const publications = getPublications(participant);

  const cameraPublication = pickPublication(publications, Track.Source.Camera, Track.Kind.Video);
  const micPublication = pickPublication(publications, Track.Source.Microphone, Track.Kind.Audio);
  const screenPublication = pickExactSource(publications, Track.Source.ScreenShare);
  const screenAudioSource = (Track.Source as any).ScreenShareAudio || "screen_share_audio";
  const screenAudioPublication =
    pickExactSource(publications, screenAudioSource) ||
    publications.find((publication: any) => {
      const source = String(publication?.source || "").toLowerCase();
      return publication?.kind === Track.Kind.Audio && (source.includes("screen") || source.includes("share"));
    });

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

  const screenAudioTrack =
    screenAudioPublication?.track ||
    screenAudioPublication?.audioTrack ||
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
  const rawName = participant?.name || participant?.identity || (isLocal ? "You" : "Participant");
  const profileId = metadata.profileId || (isLocal ? localProfile?.id : null) || String(participant?.identity || "").split(":")[0] || null;
  const matchedRow = participantRows.find((row) => {
    if (profileId && row.profile_id === profileId) return true;
    return row.display_name === rawName;
  });
  const name = matchedRow?.display_name || rawName;

  return {
    key: participant?.sid || participant?.identity || participant?.name || (isLocal ? "local" : crypto.randomUUID()),
    name,
    isLocal,
    cameraOn: Boolean(cameraTrack && !cameraMuted),
    screenOn: Boolean(screenTrack && !screenMuted),
    micOn: Boolean(microphoneTrack && !micMuted),
    cameraTrack,
    screenTrack,
    screenAudioTrack,
    microphoneTrack,
    audioLevel,
    profileId,
    avatarUrl: matchedRow?.avatar_url || metadata.avatarUrl || (isLocal ? localProfile?.avatarUrl || null : null),
    handRaised: Boolean((isLocal && localHandRaised) || matchedRow?.hand_raised)
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

function compactName(name: string) {
  const clean = String(name || "Member").trim();
  if (!clean) return "Member";
  if (clean.length <= 12) return clean;
  return `${clean.slice(0, 11).trim()}…`;
}

function screenName(name: string) {
  const clean = String(name || "Screen").trim();
  if (!clean) return "Screen";
  if (clean.length <= 14) return clean;
  return `${clean.slice(0, 13).trim()}…`;
}

function playAllAudioElements() {
  try {
    document.querySelectorAll("audio").forEach((element) => {
      const audio = element as HTMLAudioElement;
      audio.muted = false;
      audio.volume = 1;
      void audio.play?.().catch(() => undefined);
    });
  } catch {
    // ignore
  }
}

function primeAudioPlaybackGesture() {
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
      }, 70);
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
    }, 150);
  } catch {
    // ignore audio unlock errors
  }
}

function startRoomAudio(room: Room | null) {
  if (!room) return;
  void (room as any).startAudio?.().catch(() => undefined);
  playAllAudioElements();
  window.setTimeout(() => { void (room as any).startAudio?.().catch(() => undefined); playAllAudioElements(); }, 120);
  window.setTimeout(() => { void (room as any).startAudio?.().catch(() => undefined); playAllAudioElements(); }, 480);
  window.setTimeout(() => { void (room as any).startAudio?.().catch(() => undefined); playAllAudioElements(); }, 1100);
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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isLocalMicrophoneActive(room: Room | null) {
  const pubs = Array.from(((room?.localParticipant as any)?.trackPublications?.values?.() || [])) as any[];
  return pubs.some((pub: any) => {
    const source = String(pub?.source || "").toLowerCase();
    const hasMicSource = source.includes("microphone") || source.includes("mic");
    return hasMicSource && pub?.track && !pub?.isMuted && !pub?.track?.isMuted;
  });
}

function isLocalScreenShareActive(room: Room | null) {
  const pubs = Array.from(((room?.localParticipant as any)?.trackPublications?.values?.() || [])) as any[];
  return pubs.some((pub: any) => {
    const source = String(pub?.source || "").toLowerCase();
    const hasScreenSource = source.includes("screen") || source.includes("share");
    return hasScreenSource && pub?.kind === Track.Kind.Video && pub?.track && !pub?.isMuted && !pub?.track?.isMuted;
  });
}

function getLocalScreenShareAudioPublication(room: Room | null) {
  const pubs = Array.from(((room?.localParticipant as any)?.trackPublications?.values?.() || [])) as any[];
  const screenAudioSource = String((Track.Source as any).ScreenShareAudio || "screen_share_audio").toLowerCase();

  return pubs.find((pub: any) => {
    const source = String(pub?.source || "").toLowerCase();
    const name = String(pub?.trackName || pub?.name || pub?.track?.name || "").toLowerCase();
    return pub?.kind === Track.Kind.Audio && (
      source === screenAudioSource ||
      source.includes("screen_share_audio") ||
      source.includes("screenshareaudio") ||
      (source.includes("screen") && source.includes("audio")) ||
      (name.includes("screen") && name.includes("audio"))
    );
  });
}

function isLocalScreenShareAudioActive(room: Room | null) {
  const publication = getLocalScreenShareAudioPublication(room);
  const track = publication?.track || publication?.audioTrack || null;
  return Boolean(track && !publication?.isMuted && !publication?.muted && !track?.isMuted);
}

function screenShareAudioSupportMessage() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (String((navigator as any).platform || "") === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChromeLike = /Chrome|Chromium|Edg/i.test(ua) && !isIOS;

  if (isIOS || isSafari) {
    return "Screen is shared without audio. Safari/iPhone/iPad usually cannot send tab or system audio. For worship/video sound, use Chrome or Edge on a laptop and choose a browser tab with Share tab audio enabled.";
  }

  if (!isChromeLike) {
    return "Screen is shared without audio. For video sound, use Chrome or Edge on desktop/laptop, choose a browser tab, and enable Share tab audio.";
  }

  return "Screen is shared without audio. For video sound, choose Chrome Tab / browser tab, then enable Share tab audio in the browser sharing dialog. On macOS, system/window audio is usually not captured; tab audio is the reliable option.";
}

function screenShareOptionsForDevice() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (String((navigator as any).platform || "") === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChromeLike = /Chrome|Chromium|Edg/i.test(ua) && !isIOS && !isSafari;

  if (!isChromeLike) {
    // Safari/iOS and some mobile browsers do not expose screen/tab audio tracks.
    // Keep the options conservative so screen video still starts.
    return { audio: false, video: true } as any;
  }

  return {
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      restrictOwnAudio: true
    },
    video: { displaySurface: "browser" },
    systemAudio: "include",
    selfBrowserSurface: "include",
    surfaceSwitching: "include",
    monitorTypeSurfaces: "include",
    preferCurrentTab: true,
    suppressLocalAudioPlayback: false,
    contentHint: "motion"
  } as any;
}

function browserNotice() {
  const ua = navigator.userAgent || "";
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua);

  if (isSafari || isIOS) {
    return "";
  }

  return "";
}

function isIOSOrIPadOSDevice() {
  try {
    const ua = navigator.userAgent || "";
    const platform = String((navigator as any).platform || "");
    const touchPoints = Number(navigator.maxTouchPoints || 0);
    return /iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && touchPoints > 1);
  } catch {
    return false;
  }
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

export function RealLiveKitRoom({
  profile,
  admitted,
  meetingId,
  autoStart = false,
  confirmBeforeStart = true,
  onConnectionChange,
  onMediaStateChange,
  onLeave,
  onStatusChange,
  participants = [],
  localHandRaised = false,
  enterSignal = 0
}: Props) {
  const roomRef = useRef<Room | null>(null);
  const connectingRef = useRef(false);
  const autoTriedRef = useRef(false);
  const micOperationRef = useRef(false);
  const screenOperationRef = useRef(false);
  const autoHostMicStartedRef = useRef(false);
  const connectedAnnouncedRef = useRef(false);
  const participantsRef = useRef<RoomParticipant[]>(participants);
  const profileRef = useRef<UserProfile | null>(profile);
  const localHandRaisedRef = useRef(localHandRaised);
  const savedMediaPreferencesRef = useRef(loadOmideMediaPreferences());

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [screenAudioNotice, setScreenAudioNotice] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const [musicMode, setMusicMode] = useState(savedMediaPreferencesRef.current.micMode === "manual");
  const [noiseSuppression, setNoiseSuppression] = useState(savedMediaPreferencesRef.current.noiseSuppression);
  const [echoCancellation, setEchoCancellation] = useState(savedMediaPreferencesRef.current.echoCancellation);
  const [autoGainControl, setAutoGainControl] = useState(savedMediaPreferencesRef.current.autoGainControl);
  const [audioOutputId, setAudioOutputId] = useState(savedMediaPreferencesRef.current.audioOutputId);
  const [tiles, setTiles] = useState<LiveTile[]>([]);
  const [needsStart, setNeedsStart] = useState(Boolean(confirmBeforeStart));
  const [mobileDirectPending, setMobileDirectPending] = useState(false);
  const [notice] = useState(browserNotice());

  const canEnter = Boolean(profile?.status === "approved" && (isHostRole(profile) || admitted));

  function reloadSavedMediaPreferences() {
    const saved = loadOmideMediaPreferences();
    savedMediaPreferencesRef.current = saved;
    setAudioOutputId(saved.audioOutputId);
    return saved;
  }

  function saveLiveAudioPreferencePatch(next: {
    musicMode?: boolean;
    noiseSuppression?: boolean;
    echoCancellation?: boolean;
    autoGainControl?: boolean;
  }) {
    const merged = {
      ...savedMediaPreferencesRef.current,
      noiseSuppression: next.noiseSuppression ?? noiseSuppression,
      echoCancellation: next.echoCancellation ?? echoCancellation,
      autoGainControl: next.autoGainControl ?? autoGainControl,
      micMode: (next.musicMode ?? musicMode) ? "manual" as const : "auto" as const
    };
    savedMediaPreferencesRef.current = saveOmideMediaPreferences(merged);
  }

  function stableLocalHandRaised() {
    if (localHandRaised) return true;
    try {
      if (profileRef.current?.id && localStorage.getItem(`omide-hand-raised.${profileRef.current.id}`) === "true") {
        return true;
      }
    } catch {
      // ignore storage errors
    }
    return false;
  }

  function publishStatus(nextStatus: string, nextError = "", nextConnected = connected) {
    void onStatusChange?.({ status: nextStatus, error: nextError, connected: nextConnected });
  }

  async function markConnected(room: Room, message = "Connected") {
    setConnected(true);
    setStatus(message);
    setError("");
    refreshTiles(room);

    if (!connectedAnnouncedRef.current) {
      connectedAnnouncedRef.current = true;
      await onConnectionChange?.(true);
      setMicOn(false);
      setCameraOn(false);
      setScreenOn(false);
      await onMediaStateChange?.({ mic: false, camera: false });
    }
  }

  function createRoomForDevice() {
    const ios = isIOSOrIPadOSDevice();
    return new Room({
      // iPhone/iPad Safari/WebKit is stricter than desktop Chrome. For iOS host
      // entry we keep the first connection simple and avoid dynacast/adaptive
      // negotiation until the room is connected.
      adaptiveStream: !ios,
      dynacast: !ios
    });
  }

  function withConnectTimeout<T>(promise: Promise<T>, ms: number) {
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("mobile_connect_timeout")), ms);
      promise.then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      }).catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
    });
  }

  useEffect(() => {
    participantsRef.current = participants;
    profileRef.current = profile;
    localHandRaisedRef.current = stableLocalHandRaised();
    refreshTiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, profile, localHandRaised]);

  function refreshTiles(room?: Room | null) {
    const activeRoom = room || roomRef.current;

    if (!activeRoom) {
      setTiles([]);
      return;
    }

    localHandRaisedRef.current = stableLocalHandRaised();

    const nextTiles: LiveTile[] = [
      tileFromParticipant(activeRoom.localParticipant, true, participantsRef.current, profileRef.current, localHandRaisedRef.current),
      ...Array.from(activeRoom.remoteParticipants.values()).map((participant: any) =>
        tileFromParticipant(participant, false, participantsRef.current, profileRef.current, false)
      )
    ];

    setTiles(nextTiles);

    const localScreenActive = Boolean(nextTiles[0]?.screenOn || isLocalScreenShareActive(activeRoom));
    setScreenOn(localScreenActive);
  }

  function wireRoom(room: Room) {
    const update = () => {
      refreshTiles(room);
      startRoomAudio(room);
      if (isLocalScreenShareActive(room) && isLocalScreenShareAudioActive(room)) {
        setScreenAudioNotice("Screen audio is being shared.");
      }
    };

    room.on(RoomEvent.Connected, async () => {
      await markConnected(room, "Connected");
    });

    room.on(RoomEvent.Disconnected, async () => {
      connectedAnnouncedRef.current = false;
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
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      startRoomAudio(room);
      const canPlay = Boolean((room as any).canPlaybackAudio ?? true);
      if (!canPlay) {
        setStatus("Tap Enter once more to enable sound");
        publishStatus("Tap Enter once more to enable sound", "", connected);
      }
    });
  }

  async function connect(forceStart = false) {
    if (connectingRef.current || connected) return;

    if (!canEnter) {
      setError("Members must wait for host admission.");
      setStatus("Waiting Room");
      publishStatus("Waiting Room", "Members must wait for host admission.", false);
      return;
    }

    if (needsStart && !forceStart) {
      setStatus("Ready to start");
      publishStatus("Ready to start", "", false);
      return;
    }

    const mobileDevice = isMobileOrTabletDevice();
    const mobileHostMode = isHostRole(profile) && mobileDevice;

    primeAudioPlaybackGesture();
    connectingRef.current = true;
    connectedAnnouncedRef.current = false;
    setNeedsStart(false);
    setError("");
    setStatus(mobileHostMode ? "Starting mobile host..." : "Preparing...");
    publishStatus(mobileHostMode ? "Starting mobile host..." : "Preparing...", "", false);

    async function requestFreshToken() {
      return liveKitTokenService.requestToken({
        meetingId,
        profile,
        admitted: isHostRole(profile) || admitted
      });
    }

    async function disconnectCurrentRoom() {
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
        } catch {
          // ignore
        }
        roomRef.current = null;
      }
    }

    async function connectAttempt(label: string, timeoutMs: number) {
      const result = await requestFreshToken();

      if (!result.ok) {
        const message = result.message || "Could not enter meeting.";
        setStatus("Cannot enter live room");
        setError(message);
        publishStatus("Cannot enter live room", message, false);
        await onConnectionChange?.(false);
        return false;
      }

      await disconnectCurrentRoom();

      const room = createRoomForDevice();
      roomRef.current = room;
      wireRoom(room);

      setStatus(label);
      publishStatus(label, "", false);

      await withConnectTimeout(
        room.connect(result.wsUrl || liveKitReadyConfig.wsUrl, result.token, {
          autoSubscribe: true
        }),
        timeoutMs
      );

      await markConnected(room, mobileHostMode ? "Connected. Tap Mic to speak." : "Connected");
      setMobileDirectPending(false);

      startRoomAudio(room);

      if (isHostRole(profile) && !mobileHostMode && !autoHostMicStartedRef.current) {
        autoHostMicStartedRef.current = true;
        await wait(150);
        await enableMicrophone(room, true);
      } else if (mobileHostMode) {
        setStatus("Connected. Tap Mic to speak.");
        publishStatus("Connected. Tap Mic to speak.", "", true);
      }

      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 500);
      window.setTimeout(() => refreshTiles(room), 1500);
      return true;
    }

    try {
      try {
        const first = await connectAttempt(mobileDevice ? (mobileHostMode ? "Connecting mobile host..." : "Connecting mobile device...") : "Connecting...", mobileDevice ? 30000 : 18000);
        if (first) return;
      } catch (firstError) {
        console.warn("First Live connection attempt failed", firstError);
        await disconnectCurrentRoom();
        if (!mobileDevice) throw firstError;
      }

      if (mobileDevice) {
        setStatus("Retrying mobile connection...");
        publishStatus("Retrying mobile connection...", "", false);
        await wait(700);
        const second = await connectAttempt("Retrying mobile connection...", 42000);
        if (second) return;
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setMobileDirectPending(false);

      await disconnectCurrentRoom();

      roomRef.current = null;
      autoHostMicStartedRef.current = false;
      connectedAnnouncedRef.current = false;
      setConnected(false);
      setStatus("Connection failed");
      const message = mobileDevice
        ? "Could not connect on this phone/tablet. Refresh once, close other OmideNo7 tabs on this same phone, then tap Enter again. If it still fails, sign out and sign in again on this device."
        : "Could not connect.";
      setError(message);
      publishStatus("Connection failed", message, false);
      await onConnectionChange?.(false);
    } finally {
      connectingRef.current = false;
      setMobileDirectPending(false);
    }
  }

  async function directMobileHostEnter() {
    if (mobileDirectPending || connectingRef.current || connected) return;
    setMobileDirectPending(true);
    setNeedsStart(false);
    setError("");
    setStatus("Starting iPhone/iPad host mode...");
    publishStatus("Starting iPhone/iPad host mode...", "", false);
    primeAudioPlaybackGesture();
    startRoomAudio(roomRef.current);
    await connect(true);
  }

  function currentAudioOptions() {
    const saved = reloadSavedMediaPreferences();
    return buildOmideAudioConstraints(saved, {
      echoCancellation: musicMode ? false : echoCancellation,
      noiseSuppression: musicMode ? false : noiseSuppression,
      autoGainControl: musicMode ? false : autoGainControl
    });
  }

  function currentVideoOptions() {
    return buildOmideVideoConstraints(reloadSavedMediaPreferences());
  }

  async function enableMicrophone(room: Room, announce = true) {
    if (micOperationRef.current) return isLocalMicrophoneActive(room);
    micOperationRef.current = true;

    const audioOptions = currentAudioOptions();

    try {
      await (room as any).startAudio?.().catch(() => undefined);
      setStatus(announce ? "Starting host microphone..." : "Starting microphone...");

      await navigator.mediaDevices?.getUserMedia?.({ audio: audioOptions as MediaTrackConstraints }).then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      }).catch(() => undefined);

      await (room.localParticipant as any).setMicrophoneEnabled(true, audioOptions);
      await wait(450);

      if (!isLocalMicrophoneActive(room)) {
        await (room.localParticipant as any).setMicrophoneEnabled(false).catch(() => undefined);
        await wait(220);
        await (room.localParticipant as any).setMicrophoneEnabled(true, audioOptions);
        await wait(550);
      }

      if (!isLocalMicrophoneActive(room)) {
        await publishMicrophoneFallback(room, audioOptions as MediaTrackConstraints);
        await wait(350);
      }

      const actual = isLocalMicrophoneActive(room);
      setMicOn(actual);
      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 350);
      window.setTimeout(() => refreshTiles(room), 1200);
      await onMediaStateChange?.({ mic: actual, camera: cameraOn });

      if (actual) {
        setError("");
        setStatus("Host microphone on");
      } else {
        setError("Could not start microphone. Tap the microphone button once.");
        setStatus("Microphone needs tap");
      }

      return actual;
    } finally {
      micOperationRef.current = false;
    }
  }

  async function publishMicrophoneFallback(room: Room, audioOptions: MediaTrackConstraints) {
    try {
      const existingPublications = Array.from(((room.localParticipant as any)?.trackPublications?.values?.() || [])) as any[];
      for (const publication of existingPublications) {
        const source = String(publication?.source || "").toLowerCase();
        if ((source.includes("microphone") || source.includes("mic")) && publication?.track) {
          try {
            await (room.localParticipant as any).unpublishTrack(publication.track);
          } catch {
            // ignore
          }
        }
      }

      const localTrack = await createLocalAudioTrack(audioOptions as any);
      await (room.localParticipant as any).publishTrack(localTrack, {
        source: Track.Source.Microphone,
        name: "microphone"
      });
      await wait(350);
      return isLocalMicrophoneActive(room);
    } catch {
      return false;
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
      autoHostMicStartedRef.current = false;
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

    if (micOperationRef.current) return;

    const current = micOn || isLocalMicrophoneActive(room);
    const next = !current;

    if (next && !isHostRole(profile)) {
      const myRow = participants.find((row) => row.profile_id === profile?.id);
      if (myRow && myRow.allowed_mic === false) {
        setError("Microphone is locked by host.");
        return;
      }
    }

    if (next) {
      // Important: do not set micOperationRef here before calling enableMicrophone().
      // enableMicrophone() owns that lock. Older versions set the lock first, so
      // enableMicrophone() immediately returned and the mic button looked dead after mute.
      const actual = await enableMicrophone(room, false);
      setMicOn(actual);
      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 700);
      await onMediaStateChange?.({ mic: actual, camera: cameraOn });
      return;
    }

    micOperationRef.current = true;

    try {
      await (room as any).startAudio?.().catch(() => undefined);
      setStatus("Microphone muted");
      await (room.localParticipant as any).setMicrophoneEnabled(false).catch(() => undefined);

      setMicOn(false);
      setError("");
      setStatus("Connected");
      refreshTiles(room);
      window.setTimeout(() => refreshTiles(room), 700);
      await onMediaStateChange?.({ mic: false, camera: cameraOn });
    } catch (err: any) {
      setError("Could not change microphone.");
      setStatus("Microphone problem");
    } finally {
      micOperationRef.current = false;
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
      if (next) {
        await (room.localParticipant as any).setCameraEnabled(true, currentVideoOptions() as any);
      } else {
        await room.localParticipant.setCameraEnabled(false);
      }
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

    if (screenOperationRef.current) return;

    const localParticipant = room.localParticipant as any;
    const currentlySharing = isLocalScreenShareActive(room);
    const next = !currentlySharing;

    screenOperationRef.current = true;
    setError("");
    setStatus(next ? "Choose what to share..." : "Stopping screen share...");

    try {
      await (room as any).startAudio?.().catch(() => undefined);

      if (next) {
        setScreenAudioNotice("Choose a browser tab and enable Share tab audio if you want the video sound to enter the meeting.");
        await localParticipant.setScreenShareEnabled(true, screenShareOptionsForDevice());
        setScreenOn(true);
        await wait(450);

        const hasScreenAudio = isLocalScreenShareAudioActive(room);
        setStatus(hasScreenAudio ? "Screen sharing with audio" : "Screen sharing without audio");
        setScreenAudioNotice(hasScreenAudio ? "Screen audio is being shared." : screenShareAudioSupportMessage());
      } else {
        await localParticipant.setScreenShareEnabled(false).catch(() => undefined);
        setScreenOn(false);
        setScreenAudioNotice("");
        setStatus("Connected");
      }

      refreshTiles(room);
      playAllAudioElements();
      window.setTimeout(() => {
        refreshTiles(room);
        playAllAudioElements();
        if (next && isLocalScreenShareActive(room)) {
          setScreenAudioNotice(isLocalScreenShareAudioActive(room) ? "Screen audio is being shared." : screenShareAudioSupportMessage());
          setStatus(isLocalScreenShareAudioActive(room) ? "Screen sharing with audio" : "Screen sharing without audio");
        }
      }, 250);
      window.setTimeout(() => {
        refreshTiles(room);
        playAllAudioElements();
        if (next && isLocalScreenShareActive(room)) {
          setScreenAudioNotice(isLocalScreenShareAudioActive(room) ? "Screen audio is being shared." : screenShareAudioSupportMessage());
          setStatus(isLocalScreenShareAudioActive(room) ? "Screen sharing with audio" : "Screen sharing without audio");
        }
      }, 900);
      window.setTimeout(() => { refreshTiles(room); playAllAudioElements(); }, 1800);
      window.setTimeout(() => { refreshTiles(room); playAllAudioElements(); }, 3200);
    } catch (err: any) {
      const active = isLocalScreenShareActive(room);
      setScreenOn(active);
      if (!active) setScreenAudioNotice("");
      refreshTiles(room);
      const message = String(err?.message || err?.name || "").toLowerCase();
      if (message.includes("permission") || message.includes("denied") || message.includes("cancel")) {
        setError("Screen share was cancelled or blocked. Tap Share and allow screen sharing.");
      } else {
        setError("Could not start screen share. Tap Share again.");
      }
      setStatus(active ? "Screen sharing" : "Connected");
    } finally {
      screenOperationRef.current = false;
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
    if (!connected) return;
    const timer = window.setInterval(() => {
      startRoomAudio(roomRef.current);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [connected]);

  useEffect(() => {
    if (!micOn || !roomRef.current) {
      setMicLevel(0);
      return;
    }

    const timer = window.setInterval(() => {
      const local = roomRef.current?.localParticipant as any;
      const level = Math.max(0, Math.min(Number(local?.audioLevel || 0), 1));
      setMicLevel(level);
    }, 160);

    return () => window.clearInterval(timer);
  }, [micOn]);

  useEffect(() => {
    function handleLiveKitControl(event: Event) {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "unlock-audio") { primeAudioPlaybackGesture(); startRoomAudio(roomRef.current); }
      if (action === "enter-live") { primeAudioPlaybackGesture(); void connect(true); }
      if (action === "mic") void toggleMic();
      if (action === "force-mic-off") void forceMicOff();
      if (action === "camera") void toggleCamera();
      if (action === "screen") void toggleScreenShare();
      if (action === "leave") void disconnect(true);
      if (action === "force-disconnect") void disconnect(false);
    }

    window.addEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
    return () => window.removeEventListener("omide-livekit-control", handleLiveKitControl as EventListener);
  }, [micOn, cameraOn, screenOn, connected, participants, profile?.id, profile?.status, profile?.role, admitted, needsStart, meetingId]);


  useEffect(() => {
    if (!enterSignal) return;
    primeAudioPlaybackGesture();
    startRoomAudio(roomRef.current);
    void connect(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterSignal]);

  useEffect(() => {
    const unlockAudio = () => {
      primeAudioPlaybackGesture();
      startRoomAudio(roomRef.current);
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("click", unlockAudio, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  useEffect(() => {
    void onStatusChange?.({ status, error, connected });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, error, connected]);

  useEffect(() => {
    return () => {
      try {
        roomRef.current?.disconnect();
      } catch {
        // ignore
      }
    };
  }, []);

  const mobileDirectHostMode = Boolean(isHostRole(profile) && isMobileOrTabletDevice() && !connected);
  const isIOSHostMode = Boolean(isHostRole(profile) && isIOSOrIPadOSDevice() && !connected);
  const hasScreenShare = tiles.some((tile) => tile.screenOn);

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
          gap: 8px !important;
          padding: 8px !important;
          border-radius: 22px !important;
          background: linear-gradient(135deg, #06146d, #0b5798) !important;
          color: #fff !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          min-height: 100% !important;
        }

        .omide-livekit-clean-head,
        .omide-livekit-clean-status,
        .omide-share-help,
        .omide-livekit-clean-notice,
        .omide-livekit-clean-error {
          display: none !important;
        }

        .omide-livekit-clean-error {
          position: absolute !important;
          top: 10px !important;
          left: 10px !important;
          right: 10px !important;
          z-index: 60 !important;
        }


        .omide-share-audio-notice {
          position: fixed !important;
          top: calc(10px + env(safe-area-inset-top, 0px)) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 9990 !important;
          width: min(720px, calc(100vw - 24px)) !important;
          padding: 10px 14px !important;
          border-radius: 16px !important;
          background: linear-gradient(135deg, rgba(6, 20, 109, .94), rgba(0, 126, 110, .9)) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, .22) !important;
          box-shadow: 0 16px 42px rgba(0,0,0,.28) !important;
          font-size: .82rem !important;
          font-weight: 800 !important;
          line-height: 1.35 !important;
          text-align: center !important;
          pointer-events: none !important;
        }

        @media (max-width: 640px) {
          .omide-share-audio-notice {
            top: calc(8px + env(safe-area-inset-top, 0px)) !important;
            width: min(96vw, 420px) !important;
            padding: 8px 10px !important;
            border-radius: 14px !important;
            font-size: .72rem !important;
          }
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

        .omide-mobile-host-entry {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          width: min(520px, 100%) !important;
          margin: 0 auto 10px !important;
          padding: 14px !important;
          border-radius: 20px !important;
          background: rgba(255,255,255,.14) !important;
          border: 1px solid rgba(255,255,255,.22) !important;
          box-shadow: 0 16px 42px rgba(0,0,0,.22) !important;
        }

        .omide-mobile-host-entry strong {
          color: #fff !important;
          font-size: .96rem !important;
        }

        .omide-mobile-host-entry p {
          margin: 0 !important;
          color: rgba(255,255,255,.86) !important;
          font-size: .78rem !important;
          line-height: 1.4 !important;
        }

        .omide-mobile-host-entry button {
          width: 100% !important;
          border: 0 !important;
          border-radius: 999px !important;
          padding: 13px 16px !important;
          background: #13bf54 !important;
          color: #fff !important;
          font-weight: 950 !important;
          font-size: .95rem !important;
          box-shadow: 0 0 0 6px rgba(19,191,84,.14), 0 14px 30px rgba(19,191,84,.22) !important;
        }

        .omide-mobile-host-entry button:disabled {
          opacity: 1 !important;
          filter: brightness(1.08) !important;
          cursor: progress !important;
          animation: omide-mobile-host-pulse .85s ease-in-out infinite;
        }

        .omide-mobile-status {
          display: block !important;
          width: 100% !important;
          border-radius: 14px !important;
          padding: 9px 10px !important;
          background: rgba(6,20,109,.22) !important;
          color: #fff !important;
          font-size: .74rem !important;
          font-weight: 800 !important;
          line-height: 1.35 !important;
        }

        .omide-mobile-status.error {
          background: rgba(239,68,68,.30) !important;
        }

        @keyframes omide-mobile-host-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(.97); }
        }

        .omide-livekit-clean-grid {
          width: 100% !important;
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
          gap: 12px !important;
          align-items: stretch !important;
          justify-items: stretch !important;
          min-height: 0 !important;
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
          min-height: 150px !important;
          max-height: 420px !important;
          overflow: hidden !important;
          border-radius: 20px !important;
          background: #020617 !important;
          border: 1px solid rgba(255,255,255,.16) !important;
          box-shadow: 0 18px 38px rgba(0,0,0,.28) !important;
        }

        .omide-livekit-clean-grid.screen-active {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          align-content: start !important;
        }

        .omide-livekit-clean-tile.screen-tile {
          grid-column: 1 / -1 !important;
          aspect-ratio: 16 / 9 !important;
          min-height: min(52vh, 420px) !important;
          max-height: 62vh !important;
          border-radius: 22px !important;
          background: #020617 !important;
        }

        .omide-livekit-clean-tile.screen-tile .omide-video-el {
          object-fit: contain !important;
          background: #020617 !important;
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
          background: rgba(255,255,255,.96) !important;
          color: #111827 !important;
          font-weight: 950 !important;
          border: 1px solid rgba(255,255,255,.70) !important;
          box-shadow: 0 12px 26px rgba(0,0,0,.26) !important;
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
            border-radius: 0 !important;
            height: 100% !important;
            min-height: 0 !important;
          }

          .omide-mobile-host-entry {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          width: min(520px, 100%) !important;
          margin: 0 auto 10px !important;
          padding: 14px !important;
          border-radius: 20px !important;
          background: rgba(255,255,255,.14) !important;
          border: 1px solid rgba(255,255,255,.22) !important;
          box-shadow: 0 16px 42px rgba(0,0,0,.22) !important;
        }

        .omide-mobile-host-entry strong {
          color: #fff !important;
          font-size: .96rem !important;
        }

        .omide-mobile-host-entry p {
          margin: 0 !important;
          color: rgba(255,255,255,.86) !important;
          font-size: .78rem !important;
          line-height: 1.4 !important;
        }

        .omide-mobile-host-entry button {
          width: 100% !important;
          border: 0 !important;
          border-radius: 999px !important;
          padding: 13px 16px !important;
          background: #13bf54 !important;
          color: #fff !important;
          font-weight: 950 !important;
          font-size: .95rem !important;
          box-shadow: 0 0 0 6px rgba(19,191,84,.14), 0 14px 30px rgba(19,191,84,.22) !important;
        }

        .omide-mobile-host-entry button:disabled {
          opacity: 1 !important;
          filter: brightness(1.08) !important;
          cursor: progress !important;
          animation: omide-mobile-host-pulse .85s ease-in-out infinite;
        }

        .omide-mobile-status {
          display: block !important;
          width: 100% !important;
          border-radius: 14px !important;
          padding: 9px 10px !important;
          background: rgba(6,20,109,.22) !important;
          color: #fff !important;
          font-size: .74rem !important;
          font-weight: 800 !important;
          line-height: 1.35 !important;
        }

        .omide-mobile-status.error {
          background: rgba(239,68,68,.30) !important;
        }

        @keyframes omide-mobile-host-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(.97); }
        }

        .omide-livekit-clean-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            grid-auto-rows: minmax(132px, 1fr) !important;
            gap: 8px !important;
            min-height: 0 !important;
            height: 100% !important;
          }

          .omide-livekit-clean-tile {
            min-height: 132px !important;
            max-height: none !important;
            border-radius: 18px !important;
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
        /* v151 inner mobile cleanup */

        @media (max-width: 740px) {
          .omide-livekit-clean {
            border-radius: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
            min-height: 100% !important;
            overflow-y: auto !important;
          }

          .omide-mobile-host-entry {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          width: min(520px, 100%) !important;
          margin: 0 auto 10px !important;
          padding: 14px !important;
          border-radius: 20px !important;
          background: rgba(255,255,255,.14) !important;
          border: 1px solid rgba(255,255,255,.22) !important;
          box-shadow: 0 16px 42px rgba(0,0,0,.22) !important;
        }

        .omide-mobile-host-entry strong {
          color: #fff !important;
          font-size: .96rem !important;
        }

        .omide-mobile-host-entry p {
          margin: 0 !important;
          color: rgba(255,255,255,.86) !important;
          font-size: .78rem !important;
          line-height: 1.4 !important;
        }

        .omide-mobile-host-entry button {
          width: 100% !important;
          border: 0 !important;
          border-radius: 999px !important;
          padding: 13px 16px !important;
          background: #13bf54 !important;
          color: #fff !important;
          font-weight: 950 !important;
          font-size: .95rem !important;
          box-shadow: 0 0 0 6px rgba(19,191,84,.14), 0 14px 30px rgba(19,191,84,.22) !important;
        }

        .omide-mobile-host-entry button:disabled {
          opacity: 1 !important;
          filter: brightness(1.08) !important;
          cursor: progress !important;
          animation: omide-mobile-host-pulse .85s ease-in-out infinite;
        }

        .omide-mobile-status {
          display: block !important;
          width: 100% !important;
          border-radius: 14px !important;
          padding: 9px 10px !important;
          background: rgba(6,20,109,.22) !important;
          color: #fff !important;
          font-size: .74rem !important;
          font-weight: 800 !important;
          line-height: 1.35 !important;
        }

        .omide-mobile-status.error {
          background: rgba(239,68,68,.30) !important;
        }

        @keyframes omide-mobile-host-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(.97); }
        }

        .omide-livekit-clean-grid {
            padding: 8px !important;
            gap: 8px !important;
            overflow-y: auto !important;
            align-content: flex-start !important;
          }

          .omide-livekit-clean-tile {
            min-height: 170px !important;
          }
        }

        /* v152 compact square mobile participant grid */
        @media (max-width: 740px) {
          .omide-livekit-clean {
            height: auto !important;
            min-height: 0 !important;
          }

          .omide-mobile-host-entry {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          width: min(520px, 100%) !important;
          margin: 0 auto 10px !important;
          padding: 14px !important;
          border-radius: 20px !important;
          background: rgba(255,255,255,.14) !important;
          border: 1px solid rgba(255,255,255,.22) !important;
          box-shadow: 0 16px 42px rgba(0,0,0,.22) !important;
        }

        .omide-mobile-host-entry strong {
          color: #fff !important;
          font-size: .96rem !important;
        }

        .omide-mobile-host-entry p {
          margin: 0 !important;
          color: rgba(255,255,255,.86) !important;
          font-size: .78rem !important;
          line-height: 1.4 !important;
        }

        .omide-mobile-host-entry button {
          width: 100% !important;
          border: 0 !important;
          border-radius: 999px !important;
          padding: 13px 16px !important;
          background: #13bf54 !important;
          color: #fff !important;
          font-weight: 950 !important;
          font-size: .95rem !important;
          box-shadow: 0 0 0 6px rgba(19,191,84,.14), 0 14px 30px rgba(19,191,84,.22) !important;
        }

        .omide-mobile-host-entry button:disabled {
          opacity: 1 !important;
          filter: brightness(1.08) !important;
          cursor: progress !important;
          animation: omide-mobile-host-pulse .85s ease-in-out infinite;
        }

        .omide-mobile-status {
          display: block !important;
          width: 100% !important;
          border-radius: 14px !important;
          padding: 9px 10px !important;
          background: rgba(6,20,109,.22) !important;
          color: #fff !important;
          font-size: .74rem !important;
          font-weight: 800 !important;
          line-height: 1.35 !important;
        }

        .omide-mobile-status.error {
          background: rgba(239,68,68,.30) !important;
        }

        @keyframes omide-mobile-host-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(.97); }
        }

        .omide-livekit-clean-grid {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            grid-auto-rows: auto !important;
            align-content: start !important;
            justify-content: stretch !important;
            gap: 6px !important;
            padding: 7px !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }

          .omide-livekit-clean-tile {
            aspect-ratio: 1 / 1 !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            border-radius: 14px !important;
          }

          .omide-livekit-clean-avatar span,
          .omide-livekit-clean-avatar-img {
            width: 46px !important;
            height: 46px !important;
            border-radius: 15px !important;
            font-size: 1rem !important;
          }

          .omide-livekit-clean-namebar {
            left: 4px !important;
            right: 4px !important;
            bottom: 4px !important;
            padding: 4px 5px !important;
            border-radius: 10px !important;
          }

          .omide-livekit-clean-namebar strong {
            font-size: .56rem !important;
          }

          .omide-livekit-clean-namebar small {
            display: none !important;
          }

          .omide-livekit-hand-badge {
            top: 5px !important;
            left: 5px !important;
            min-width: 24px !important;
            height: 24px !important;
            padding: 0 5px !important;
            font-size: .78rem !important;
          }

          .omide-livekit-clean-eq {
            left: 6px !important;
            bottom: 30px !important;
            width: 34px !important;
            height: 5px !important;
          }
        }

        @media (max-width: 740px) {
          .omide-livekit-clean-grid.screen-active {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 6px !important;
          }

          .omide-livekit-clean-tile.screen-tile {
            grid-column: 1 / -1 !important;
            aspect-ratio: 16 / 9 !important;
            min-height: 218px !important;
            max-height: 54svh !important;
            border-radius: 14px !important;
          }
        }

        @media (max-width: 380px) {
          .omide-mobile-host-entry {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          width: min(520px, 100%) !important;
          margin: 0 auto 10px !important;
          padding: 14px !important;
          border-radius: 20px !important;
          background: rgba(255,255,255,.14) !important;
          border: 1px solid rgba(255,255,255,.22) !important;
          box-shadow: 0 16px 42px rgba(0,0,0,.22) !important;
        }

        .omide-mobile-host-entry strong {
          color: #fff !important;
          font-size: .96rem !important;
        }

        .omide-mobile-host-entry p {
          margin: 0 !important;
          color: rgba(255,255,255,.86) !important;
          font-size: .78rem !important;
          line-height: 1.4 !important;
        }

        .omide-mobile-host-entry button {
          width: 100% !important;
          border: 0 !important;
          border-radius: 999px !important;
          padding: 13px 16px !important;
          background: #13bf54 !important;
          color: #fff !important;
          font-weight: 950 !important;
          font-size: .95rem !important;
          box-shadow: 0 0 0 6px rgba(19,191,84,.14), 0 14px 30px rgba(19,191,84,.22) !important;
        }

        .omide-mobile-host-entry button:disabled {
          opacity: 1 !important;
          filter: brightness(1.08) !important;
          cursor: progress !important;
          animation: omide-mobile-host-pulse .85s ease-in-out infinite;
        }

        .omide-mobile-status {
          display: block !important;
          width: 100% !important;
          border-radius: 14px !important;
          padding: 9px 10px !important;
          background: rgba(6,20,109,.22) !important;
          color: #fff !important;
          font-size: .74rem !important;
          font-weight: 800 !important;
          line-height: 1.35 !important;
        }

        .omide-mobile-status.error {
          background: rgba(239,68,68,.30) !important;
        }

        @keyframes omide-mobile-host-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(.97); }
        }

        .omide-livekit-clean-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 5px !important;
          }

          .omide-livekit-clean-tile.screen-tile {
            min-height: 198px !important;
          }
        }

        /* v151 hide duplicate internal controls/status after all component CSS */
        .omide-livekit-clean-head,
        .omide-livekit-clean-status,
        .omide-share-help,
        .omide-livekit-clean-notice {
          display: none !important;
        }


        /* v161 final overlay fix: no black name bar; small chip only */
        .omide-livekit-clean .omide-livekit-clean-namebar {
          position: absolute !important;
          left: 8px !important;
          right: auto !important;
          bottom: 8px !important;
          top: auto !important;
          z-index: 22 !important;
          max-width: min(150px, 45%) !important;
          width: auto !important;
          border-radius: 999px !important;
          padding: 3px 7px !important;
          background: rgba(255,255,255,.88) !important;
          color: #0f172a !important;
          border: 1px solid rgba(15,23,42,.14) !important;
          box-shadow: 0 8px 18px rgba(0,0,0,.18) !important;
          backdrop-filter: blur(4px) !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          pointer-events: none !important;
        }

        .omide-livekit-clean .omide-livekit-clean-namebar strong {
          color: #0f172a !important;
          font-size: .58rem !important;
          line-height: 1 !important;
          font-weight: 900 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
        }

        .omide-livekit-clean .omide-livekit-clean-tile.screen-tile .omide-livekit-clean-namebar {
          top: 8px !important;
          bottom: auto !important;
          left: 8px !important;
          max-width: 126px !important;
          opacity: .78 !important;
        }

        .omide-livekit-clean .omide-livekit-clean-tile.screen-tile .omide-livekit-clean-namebar strong {
          font-size: .54rem !important;
        }

        @media (max-width: 740px) {
          .omide-livekit-clean .omide-livekit-clean-namebar {
            left: 5px !important;
            bottom: 5px !important;
            padding: 2px 5px !important;
            max-width: 58px !important;
            opacity: .82 !important;
          }

          .omide-livekit-clean .omide-livekit-clean-namebar strong {
            font-size: .48rem !important;
          }

          .omide-livekit-clean .omide-livekit-clean-tile.screen-tile .omide-livekit-clean-namebar {
            top: 6px !important;
            bottom: auto !important;
            left: 6px !important;
            max-width: 74px !important;
            opacity: .72 !important;
          }
        }


        /* v163: use a new name chip class so old black namebar CSS cannot override it */
        .omide-livekit-clean .omide-livekit-namechip {
          position: absolute !important;
          left: 7px !important;
          bottom: 7px !important;
          z-index: 28 !important;
          max-width: min(120px, 42%) !important;
          width: auto !important;
          border-radius: 999px !important;
          padding: 2px 6px !important;
          background: rgba(255,255,255,.86) !important;
          color: #0f172a !important;
          border: 1px solid rgba(15,23,42,.12) !important;
          box-shadow: 0 6px 14px rgba(0,0,0,.14) !important;
          backdrop-filter: blur(4px) !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          pointer-events: none !important;
        }

        .omide-livekit-clean .omide-livekit-namechip strong {
          color: #0f172a !important;
          font-size: .52rem !important;
          line-height: 1 !important;
          font-weight: 900 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
        }

        .omide-livekit-clean .omide-livekit-clean-tile.screen-tile .omide-livekit-namechip {
          top: 7px !important;
          bottom: auto !important;
          left: 7px !important;
          max-width: 70px !important;
          opacity: .68 !important;
        }

        .omide-livekit-clean .omide-livekit-clean-tile.screen-tile .omide-livekit-namechip strong {
          font-size: .46rem !important;
        }

        @media (max-width: 740px) {
          .omide-livekit-clean .omide-livekit-namechip {
            left: 5px !important;
            bottom: 5px !important;
            padding: 2px 5px !important;
            max-width: 54px !important;
            opacity: .78 !important;
          }

          .omide-livekit-clean .omide-livekit-namechip strong {
            font-size: .45rem !important;
          }

          .omide-livekit-clean .omide-livekit-clean-tile.screen-tile .omide-livekit-namechip {
            top: 5px !important;
            bottom: auto !important;
            left: 5px !important;
            max-width: 54px !important;
            opacity: .58 !important;
          }
        }

      `}</style>

      <div className="omide-livekit-clean-head">
        <div className="omide-livekit-clean-title">
          <strong>OmideNo7 Live Room</strong>
          <span>{connected ? "Connected" : "Ready"}</span>
        </div>

        <div className="omide-livekit-clean-actions">
          {!connected && (
            <button
              className="primary"
              type="button"
              onClick={() => void connect(true)}
              disabled={!canEnter || connectingRef.current}
            >
              {connectingRef.current ? "Connecting..." : isMobileOrTabletDevice() && isHostRole(profile) ? "Start host" : "Enter live"}
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

          <div className="omide-audio-settings-wrap">
            <button type="button" onClick={() => setAudioSettingsOpen((value) => !value)}>
              Mic <span className="omide-local-mic-meter"><span style={{ width: `${Math.max(4, Math.round(micLevel * 100))}%` }} /></span>
            </button>
            {audioSettingsOpen && (
              <div className="omide-audio-settings-popover">
                <strong>Audio settings</strong>
                <label>Music / keyboard mode <input type="checkbox" checked={musicMode} onChange={(event) => { const value = event.target.checked; setMusicMode(value); saveLiveAudioPreferencePatch({ musicMode: value }); }} /></label>
                <label>Noise suppression <input type="checkbox" checked={noiseSuppression} disabled={musicMode} onChange={(event) => { const value = event.target.checked; setNoiseSuppression(value); saveLiveAudioPreferencePatch({ noiseSuppression: value }); }} /></label>
                <label>Echo cancellation <input type="checkbox" checked={echoCancellation} disabled={musicMode} onChange={(event) => { const value = event.target.checked; setEchoCancellation(value); saveLiveAudioPreferencePatch({ echoCancellation: value }); }} /></label>
                <label>Auto gain <input type="checkbox" checked={autoGainControl} disabled={musicMode} onChange={(event) => { const value = event.target.checked; setAutoGainControl(value); saveLiveAudioPreferencePatch({ autoGainControl: value }); }} /></label>
                <small>{musicMode ? "Music mode keeps keyboard/worship sound more natural. Turn mic off/on after changing this." : "Normal speech mode is recommended for preaching."}</small>
              </div>
            )}
          </div>

          <button className="danger" type="button" onClick={() => void disconnect(true)}>
            Leave
          </button>
        </div>
      </div>

      {mobileDirectHostMode && (
        <div className="omide-mobile-host-entry">
          <strong>{isIOSHostMode ? "iPhone / iPad host entry" : "Mobile host entry"}</strong>
          <p>For mobile host devices, start the live room from this green button. After it connects, tap Mic to speak.</p>
          {isIOSHostMode && <p>Best on iPhone/iPad: open this page in Safari, not Chrome.</p>}
          <button onClick={directMobileHostEnter} disabled={mobileDirectPending || connectingRef.current}>
            {mobileDirectPending || connectingRef.current ? "Starting..." : "Start Live on this device"}
          </button>
          <div className={error ? "omide-mobile-status error" : "omide-mobile-status"}>
            Status: {status}{error ? ` · ${error}` : ""}
          </div>
        </div>
      )}

      <div className="omide-livekit-clean-status">{status}</div>
      <div className="omide-share-help">Screen share: for video sound, use Chrome/Edge desktop and choose Chrome Tab with Share tab audio enabled.</div>
      {screenAudioNotice && <div className="omide-share-audio-notice">{screenAudioNotice}</div>}

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
        <div className={hasScreenShare ? "omide-livekit-clean-grid screen-active" : "omide-livekit-clean-grid"}>
          {tiles.map((tile) => (
            <article className={tile.screenOn ? "omide-livekit-clean-tile screen-tile" : "omide-livekit-clean-tile"} key={tile.key}>
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

              <AudioTrackView track={tile.isLocal ? null : tile.microphoneTrack} sinkId={audioOutputId} />
              <AudioTrackView track={tile.isLocal ? null : tile.screenAudioTrack} sinkId={audioOutputId} />

              {tile.micOn && (
                <div className="omide-livekit-clean-eq">
                  <span style={{ width: `${Math.max(8, Math.round(tile.audioLevel * 100))}%` }} />
                </div>
              )}

              <div className="omide-livekit-namechip" title={tile.name}>
                <strong>{tile.screenOn ? screenName(tile.name) : compactName(tile.name)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default RealLiveKitRoom;
