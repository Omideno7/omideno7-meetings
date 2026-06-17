import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { demoStore } from "../services/demoStore";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";
import { useAppState } from "../app/AppState";

export function LiveMeetingPage() {
  const { setRoute } = useAppState();
  useDemoStoreVersion();
  const state = demoStore.getMeetingState();

  function toggle(key: string) {
    demoStore.setMeetingState({ [key]: !state[key] });
  }

  return (
    <div className="page-grid">
      <Card>
        <h1>Live Meeting</h1>
        <p>Production video/audio will use LiveKit token server. This screen already enforces the intended UX: mic/camera off by default and user-controlled camera consent.</p>
        <div className="meeting-stage">
          <strong>{state.camera ? "Camera Preview On" : "Audio-only Speaker Area"}</strong>
          <span>{state.mic ? "Microphone on by user action" : "Microphone off by default"}</span>
          <span>{state.recording ? "Recording demo is ON" : "Recording demo is OFF"}</span>
          <span>{state.lectureMode ? "Lecture Mode: members cannot unmute" : "Normal Mode"}</span>
          <span>{state.lowBandwidth ? "Low Bandwidth Mode: audio-first optimized" : "Standard quality mode"}</span>
        </div>
        <div className="button-row">
          <Button variant={state.mic ? "primary" : "secondary"} onClick={() => toggle("mic")}>{state.mic ? "Mic On" : "Mic Off"}</Button>
          <Button variant={state.camera ? "primary" : "secondary"} onClick={() => toggle("camera")}>{state.camera ? "Camera On" : "Camera Off"}</Button>
          <Button variant="secondary" onClick={() => demoStore.setMeetingState({ speaker: state.speaker === "speaker" ? "earpiece" : "speaker" })}>{state.speaker === "speaker" ? "Speaker" : "Earpiece"}</Button>
          <Button variant={state.lowBandwidth ? "primary" : "secondary"} onClick={() => toggle("lowBandwidth")}>Low Bandwidth</Button>
          <Button variant={state.lectureMode ? "danger" : "secondary"} onClick={() => toggle("lectureMode")}>Lecture Mode</Button>
          <Button variant={state.recording ? "danger" : "secondary"} onClick={() => toggle("recording")}>{state.recording ? "Stop Recording" : "Start Recording"}</Button>
          <Button variant="ghost" onClick={() => setRoute("waitingRoom")}>Leave</Button>
        </div>
      </Card>
    </div>
  );
}
