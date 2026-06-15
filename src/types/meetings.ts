export type MeetingMode = "sermon" | "prayer" | "class" | "meeting";
export type WaitingRoomStatus = "not_requested" | "waiting" | "admitted" | "rejected" | "removed";

export type Meeting = {
  id: string;
  title: string;
  mode: MeetingMode;
  startsAt: string;
  status: "scheduled" | "opening" | "live" | "ended";
};

export type LiveMeetingDefaults = {
  microphoneEnabled: false;
  cameraEnabled: false;
  audioOutput: "speaker" | "earpiece";
  lowBandwidthMode: boolean;
};
