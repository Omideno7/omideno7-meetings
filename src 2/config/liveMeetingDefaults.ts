import type { LiveMeetingDefaults } from "../types/meetings";

export const liveMeetingDefaults: LiveMeetingDefaults = {
  microphoneEnabled: false,
  cameraEnabled: false,
  audioOutput: "speaker",
  lowBandwidthMode: false
};

export const lockedRules = [
  "Every participant enters with microphone off",
  "Every participant enters with camera off",
  "Waiting Room admission is required before LiveKit token",
  "Emergency Lockdown is Owner-only",
  "Speaker controls their own camera state",
  "Hosts cannot turn participant camera on without consent"
];
