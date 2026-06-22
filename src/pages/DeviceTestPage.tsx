import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

type DeviceInfo = {
  label: string;
  kind: string;
  id: string;
};

export function DeviceTestPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const [message, setMessage] = useState("");
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micStatus, setMicStatus] = useState("Microphone is off.");

  async function loadDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setMessage("This browser does not support device listing.");
      return;
    }

    const list = await navigator.mediaDevices.enumerateDevices();
    setDevices(list.map((device) => ({
      label: device.label || `${device.kind} ${device.deviceId.slice(0, 6)}`,
      kind: device.kind,
      id: device.deviceId
    })));
  }

  function startAudioMeter(stream: MediaStream) {
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      setMicStatus("No microphone track found.");
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      setMicStatus("Audio meter is not supported in this browser, but microphone permission was granted.");
      return;
    }

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      const level = Math.min(100, Math.round((average / 120) * 100));
      setMicLevel(level);
      if (level > 12) {
        setMicStatus("Microphone is receiving sound.");
      } else {
        setMicStatus("Microphone is active. Speak to test the level.");
      }
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();
  }

  async function startTest(video: boolean, audio: boolean) {
    try {
      stopTest();

      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage("Camera/microphone test is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraOn(video);
      setMicOn(audio);
      setMessage("Device test is active. This is a local browser test.");
      if (audio) startAudioMeter(stream);
      if (!audio) setMicStatus("Microphone is off.");
      await loadDevices();
    } catch (error: any) {
      setMessage(error?.message || "Could not access camera/microphone. Check browser permissions.");
      setCameraOn(false);
      setMicOn(false);
      setMicLevel(0);
      setMicStatus("Microphone test failed.");
    }
  }

  function stopTest() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setMicOn(false);
    setMicLevel(0);
    setMicStatus("Microphone is off.");
  }

  useEffect(() => {
    void loadDevices();
    return () => stopTest();
  }, []);

  return (
    <div className="page-grid">
      <Card>
        <h1>Video / Audio Test</h1>
        <p>This page tests the phone or computer camera and microphone inside the app before joining a meeting.</p>
        <div className="device-preview">
          <video ref={videoRef} playsInline muted />
          {!cameraOn && <span>Camera preview is off</span>}
        </div>

        <div className="audio-meter-card">
          <div className="audio-meter-head">
            <strong>Microphone level</strong>
            <span>{micStatus}</span>
          </div>
          <div className="audio-meter-track">
            <div className="audio-meter-fill" style={{ width: `${micLevel}%` }} />
          </div>
          <p>{micOn ? "Speak now. The green bar should move if the microphone is working." : "Press Test Mic Only or Test Camera + Mic."}</p>
        </div>

        <div className="button-row">
          <Button onClick={() => startTest(true, true)}>Test Camera + Mic</Button>
          <Button variant="secondary" onClick={() => startTest(false, true)}>Test Mic Only</Button>
          <Button variant="ghost" onClick={stopTest}>Stop Test</Button>
        </div>
        {message && <p className="auth-message">{message}</p>}
      </Card>

      <div className="dashboard-grid">
        <Card>
          <h2>Current Status</h2>
          <p>Camera: {cameraOn ? "On" : "Off"}</p>
          <p>Microphone: {micOn ? "On" : "Off"}</p>
          <p>Microphone level: {micLevel}%</p>
        </Card>
        <Card>
          <h2>Detected Devices</h2>
          {devices.length ? (
            <ul>
              {devices.map((device) => (
                <li key={`${device.kind}-${device.id}`}>{device.kind}: {device.label}</li>
              ))}
            </ul>
          ) : (
            <p>No devices listed yet. Press Test Camera + Mic and allow permissions.</p>
          )}
        </Card>
      </div>

      <Card>
        <h2>Real Video Call Requirement</h2>
        <p>For a real church meeting with many people, the app must connect to LiveKit or another WebRTC server. This test only proves the user device is ready.</p>
      </Card>
    </div>
  );
}
