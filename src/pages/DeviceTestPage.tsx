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
  const [message, setMessage] = useState("");
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

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
      setMessage("Device test is active. This is a local browser camera/microphone test, not yet a real group call.");
      await loadDevices();
    } catch (error: any) {
      setMessage(error?.message || "Could not access camera/microphone. Check browser permissions.");
      setCameraOn(false);
      setMicOn(false);
    }
  }

  function stopTest() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setMicOn(false);
  }

  useEffect(() => {
    void loadDevices();
    return () => stopTest();
  }, []);

  return (
    <div className="page-grid">
      <Card>
        <h1>Video / Audio Test</h1>
        <p>This page tests the phone or computer camera and microphone inside the app. Real multi-person calls need the LiveKit token server in the next backend phase.</p>
        <div className="device-preview">
          <video ref={videoRef} playsInline muted />
          {!cameraOn && <span>Camera preview is off</span>}
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
        <p>For a real church meeting with many people, the app must connect to LiveKit or another WebRTC server. Frontend preview alone cannot host secure multi-person meetings.</p>
        <p>Next backend phase: LiveKit Cloud/self-host, secure token endpoint, room creation, participant permissions, recording service, TURN/SFU configuration.</p>
      </Card>
    </div>
  );
}
