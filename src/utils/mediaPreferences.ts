export type OmideCameraFacingMode = "auto" | "user" | "environment";
export type OmideVideoQuality = "auto" | "low" | "hd" | "fullhd";
export type OmideMicMode = "auto" | "manual";

export type OmideMediaPreferences = {
  videoDeviceId: string;
  audioInputId: string;
  audioOutputId: string;
  quality: OmideVideoQuality;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  micMode: OmideMicMode;
  backgroundMode: string;
  facingMode: OmideCameraFacingMode;
  savedAt: number;
};

export const OMIDE_MEDIA_PREFERENCES_KEY = "omideno7.media.preferences.v1";

export const OMIDE_QUALITY_PRESETS: Record<OmideVideoQuality, MediaTrackConstraints> = {
  auto: {},
  low: { width: 640, height: 360 },
  hd: { width: 1280, height: 720 },
  fullhd: { width: 1920, height: 1080 }
};

export const OMIDE_DEFAULT_MEDIA_PREFERENCES: OmideMediaPreferences = {
  videoDeviceId: "",
  audioInputId: "",
  audioOutputId: "",
  quality: "hd",
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  micMode: "auto",
  backgroundMode: "none",
  facingMode: "auto",
  savedAt: 0
};

function isFacingMode(value: unknown): value is OmideCameraFacingMode {
  return value === "auto" || value === "user" || value === "environment";
}

function isQuality(value: unknown): value is OmideVideoQuality {
  return value === "auto" || value === "low" || value === "hd" || value === "fullhd";
}

function isMicMode(value: unknown): value is OmideMicMode {
  return value === "auto" || value === "manual";
}

function boolOrDefault(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeOmideMediaPreferences(input: Partial<OmideMediaPreferences> | null | undefined): OmideMediaPreferences {
  const raw = input || {};

  return {
    videoDeviceId: typeof raw.videoDeviceId === "string" ? raw.videoDeviceId : OMIDE_DEFAULT_MEDIA_PREFERENCES.videoDeviceId,
    audioInputId: typeof raw.audioInputId === "string" ? raw.audioInputId : OMIDE_DEFAULT_MEDIA_PREFERENCES.audioInputId,
    audioOutputId: typeof raw.audioOutputId === "string" ? raw.audioOutputId : OMIDE_DEFAULT_MEDIA_PREFERENCES.audioOutputId,
    quality: isQuality(raw.quality) ? raw.quality : OMIDE_DEFAULT_MEDIA_PREFERENCES.quality,
    noiseSuppression: boolOrDefault(raw.noiseSuppression, OMIDE_DEFAULT_MEDIA_PREFERENCES.noiseSuppression),
    echoCancellation: boolOrDefault(raw.echoCancellation, OMIDE_DEFAULT_MEDIA_PREFERENCES.echoCancellation),
    autoGainControl: boolOrDefault(raw.autoGainControl, OMIDE_DEFAULT_MEDIA_PREFERENCES.autoGainControl),
    micMode: isMicMode(raw.micMode) ? raw.micMode : OMIDE_DEFAULT_MEDIA_PREFERENCES.micMode,
    backgroundMode: typeof raw.backgroundMode === "string" ? raw.backgroundMode : OMIDE_DEFAULT_MEDIA_PREFERENCES.backgroundMode,
    facingMode: isFacingMode(raw.facingMode) ? raw.facingMode : OMIDE_DEFAULT_MEDIA_PREFERENCES.facingMode,
    savedAt: typeof raw.savedAt === "number" ? raw.savedAt : 0
  };
}

export function loadOmideMediaPreferences(): OmideMediaPreferences {
  try {
    const saved = localStorage.getItem(OMIDE_MEDIA_PREFERENCES_KEY);
    if (!saved) return { ...OMIDE_DEFAULT_MEDIA_PREFERENCES };
    return normalizeOmideMediaPreferences(JSON.parse(saved));
  } catch {
    return { ...OMIDE_DEFAULT_MEDIA_PREFERENCES };
  }
}

export function saveOmideMediaPreferences(next: Partial<OmideMediaPreferences>) {
  const saved = normalizeOmideMediaPreferences({
    ...loadOmideMediaPreferences(),
    ...next,
    savedAt: Date.now()
  });

  try {
    localStorage.setItem(OMIDE_MEDIA_PREFERENCES_KEY, JSON.stringify(saved));
  } catch {
    // Ignore storage errors; media selection still works for the current page.
  }

  return saved;
}

export function buildOmideVideoConstraints(preferences = loadOmideMediaPreferences()): MediaTrackConstraints | true {
  const prefs = normalizeOmideMediaPreferences(preferences);
  const preset = OMIDE_QUALITY_PRESETS[prefs.quality] || {};

  if (prefs.videoDeviceId) {
    return {
      ...preset,
      deviceId: { exact: prefs.videoDeviceId }
    };
  }

  if (prefs.facingMode !== "auto") {
    return {
      ...preset,
      facingMode: prefs.facingMode
    };
  }

  return Object.keys(preset).length ? preset : true;
}

export function buildOmideAudioConstraints(
  preferences = loadOmideMediaPreferences(),
  overrides: Partial<Pick<OmideMediaPreferences, "noiseSuppression" | "echoCancellation" | "autoGainControl">> = {}
): MediaTrackConstraints | true {
  const prefs = normalizeOmideMediaPreferences({ ...preferences, ...overrides });

  return {
    deviceId: prefs.audioInputId ? { exact: prefs.audioInputId } : undefined,
    noiseSuppression: prefs.noiseSuppression,
    echoCancellation: prefs.echoCancellation,
    autoGainControl: prefs.autoGainControl
  };
}
