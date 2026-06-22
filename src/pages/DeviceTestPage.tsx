import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

type DeviceInfo = {
  label: string;
  kind: MediaDeviceKind;
  id: string;
};

const qualityPresets = {
  auto: {},
  low: { width: 640, height: 360 },
  hd: { width: 1280, height: 720 },
  fullhd: { width: 1920, height: 1080 }
};

export function DeviceTestPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastModeRef = useRef<{ video: boolean; audio: boolean }>({ video: false, audio: false });

  const [message, setMessage] = useState("Choose your camera, microphone and speaker, then press Test.");
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micStatus, setMicStatus] = useState("Microphone is off.");
  const [videoDeviceId, setVideoDeviceId] = useState("");
  const [audioInputId, setAudioInputId] = useState("");
  const [audioOutputId, setAudioOutputId] = useState("");
  const [quality, setQuality] = useState<keyof typeof qualityPresets>("hd");
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [micMode, setMicMode] = useState<"auto" | "manual">("auto");
  const [backgroundMode, setBackgroundMode] = useState("none");
  const [facingMode, setFacingMode] = useState<"auto" | "user" | "environment">("auto");
  const [permissionGranted, setPermissionGranted] = useState(false);

  const videoInputs = useMemo(() => devices.filter((device) => device.kind === "videoinput"), [devices]);
  const audioInputs = useMemo(() => devices.filter((device) => device.kind === "audioinput"), [devices]);
  const audioOutputs = useMemo(() => devices.filter((device) => device.kind === "audiooutput"), [devices]);

  async function loadDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setMessage("This browser does not support device listing.");
      return;
    }

    const list = await navigator.mediaDevices.enumerateDevices();
    const mapped = list.map((device) => ({
      label: device.label || `${device.kind} ${device.deviceId.slice(0, 6)}`,
      kind: device.kind,
      id: device.deviceId
    }));

    setDevices(mapped);
    setVideoDeviceId((current) => current || mapped.find((device) => device.kind === "videoinput")?.id || "");
    setAudioInputId((current) => current || mapped.find((device) => device.kind === "audioinput")?.id || "");
    setAudioOutputId((current) => current || mapped.find((device) => device.kind === "audiooutput")?.id || "");

    if (!mapped.length) {
      setMessage("No devices visible yet. Press Allow / Refresh Devices and allow camera/microphone permission.");
    }
  }

  async function requestPermissionAndRefresh() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionGranted(true);
      await loadDevices();
      setMessage("Permission granted. Device names should now appear in the selectors.");
    } catch (error: any) {
      setMessage(error?.message || "Permission was not granted. Please allow camera/microphone access in the browser.");
    }
  }

  async function applyAudioOutput(deviceId: string) {
    setAudioOutputId(deviceId);
    const element = audioRef.current || videoRef.current;
    if (element && "setSinkId" in element && deviceId) {
      try {
        await (element as any).setSinkId(deviceId);
        setMessage("Audio output changed. Headset/speaker selection applied.");
      } catch (error: any) {
        setMessage(error?.message || "Could not change audio output in this browser.");
      }
    } else {
      setMessage("This browser may not support manual speaker/headset selection. Use system audio settings if needed.");
    }
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
      if (level > 12) setMicStatus("Microphone is receiving sound.");
      else setMicStatus("Microphone is active. Speak to test the level.");
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();
  }

  function getVideoConstraints(video: boolean) {
    if (!video) return false;
    const preset = qualityPresets[quality] as any;
    if (videoDeviceId) return { deviceId: { exact: videoDeviceId }, ...preset };
    if (facingMode !== "auto") return { facingMode, ...preset };
    return { ...preset };
  }

  function getAudioConstraints(audio: boolean) {
    if (!audio) return false;
    return {
      deviceId: audioInputId ? { exact: audioInputId } : undefined,
      noiseSuppression,
      echoCancellation,
      autoGainControl
    };
  }

  async function startTest(video: boolean, audio: boolean) {
    try {
      stopTest(false);
      lastModeRef.current = { video, audio };

      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage("Camera/microphone test is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: getVideoConstraints(video), audio: getAudioConstraints(audio) });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.muted = true;
      }

      setPermissionGranted(true);
      setCameraOn(video);
      setMicOn(audio);
      setMessage("Device test is active. If you change camera/mic/quality, press Apply Selected Devices.");
      if (audio) startAudioMeter(stream);
      if (!audio) setMicStatus("Microphone is off.");
      await loadDevices();
    } catch (error: any) {
      setMessage(error?.message || "Could not access selected camera/microphone. Try Auto camera or another device.");
      setCameraOn(false);
      setMicOn(false);
      setMicLevel(0);
      setMicStatus("Microphone test failed.");
    }
  }

  async function applySelectedDevices() {
    const { video, audio } = lastModeRef.current;
    if (!video && !audio) {
      setMessage("First start a camera or microphone test, then change options and press Apply.");
      return;
    }
    await startTest(video, audio);
  }

  function stopTest(resetMessage = true) {
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
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setCameraOn(false);
    setMicOn(false);
    setMicLevel(0);
    setMicStatus("Microphone is off.");
    if (resetMessage) setMessage("Test stopped.");
  }

  useEffect(() => {
    void loadDevices();
    return () => stopTest(false);
  }, []);

  return (
    <div className="page-grid device-test-page">
      <Card className="device-selector-card">
        <h1>Video / Audio Test</h1>
        <p className="device-warning">
          First press <strong>Allow / Refresh Devices</strong>. Device changes usually need <strong>Apply Selected Devices</strong> because browsers do not switch cameras/mics automatically while a stream is active.
        </p>

        <div className="device-selectors-top">
          <label><strong>1. Camera / External webcam</strong><select value={videoDeviceId} onChange={(event) => { setVideoDeviceId(event.target.value); if (event.target.value) setFacingMode("auto"); }}><option value="">Auto camera</option>{videoInputs.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}</select></label>
          <label><strong>2. Phone camera side</strong><select value={facingMode} onChange={(event) => { setFacingMode(event.target.value as typeof facingMode); if (event.target.value !== "auto") setVideoDeviceId(""); }}><option value="auto">Auto / selected camera</option><option value="user">Front camera</option><option value="environment">Back camera</option></select></label>
          <label><strong>3. Microphone / External mic</strong><select value={audioInputId} onChange={(event) => setAudioInputId(event.target.value)}><option value="">Auto microphone</option>{audioInputs.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}</select></label>
          <label><strong>4. Speaker / Headphones</strong><select value={audioOutputId} onChange={(event) => applyAudioOutput(event.target.value)}><option value="">System default</option>{audioOutputs.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}</select></label>
          <label><strong>5. Video quality</strong><select value={quality} onChange={(event) => setQuality(event.target.value as keyof typeof qualityPresets)}><option value="auto">Auto</option><option value="low">Low 360p</option><option value="hd">HD 720p</option><option value="fullhd">Full HD 1080p</option></select></label>
          <label><strong>6. Background preview</strong><select value={backgroundMode} onChange={(event) => setBackgroundMode(event.target.value)}><option value="none">None</option><option value="soft-blur">Soft blur preview</option><option value="church">Church background preview</option><option value="blue">OmideNo7 blue background</option></select></label>
        </div>

        <div className="noise-control-panel">
          <label><input type="checkbox" checked={noiseSuppression} onChange={(event) => setNoiseSuppression(event.target.checked)} /> Noise suppression</label>
          <label><input type="checkbox" checked={echoCancellation} onChange={(event) => setEchoCancellation(event.target.checked)} /> Echo cancellation</label>
          <label><input type="checkbox" checked={autoGainControl} onChange={(event) => setAutoGainControl(event.target.checked)} /> Auto gain control</label>
          <label>Mic mode <select value={micMode} onChange={(event) => setMicMode(event.target.value as "auto" | "manual")}><option value="auto">Auto</option><option value="manual">Manual</option></select></label>
        </div>

        <div className="button-row">
          <Button onClick={requestPermissionAndRefresh}>Allow / Refresh Devices</Button>
          <Button variant="secondary" onClick={() => startTest(true, true)}>Test Camera + Mic</Button>
          <Button variant="secondary" onClick={() => startTest(false, true)}>Test Mic Only</Button>
          <Button variant="secondary" onClick={() => startTest(true, false)}>Test Camera Only</Button>
          <Button onClick={applySelectedDevices}>Apply Selected Devices</Button>
          <Button variant="ghost" onClick={() => stopTest()}>Stop Test</Button>
        </div>
        <p className={`auth-message ${permissionGranted ? "message-success" : ""}`}>{message}</p>
      </Card>

      <Card>
        <h2>Preview</h2>
        <div className={`device-preview background-${backgroundMode}`}>
          <video ref={videoRef} playsInline muted />
          {!cameraOn && <span>Camera preview is off</span>}
          {backgroundMode !== "none" && <em className="background-label">Background preview: {backgroundMode}</em>}
        </div>
        <audio ref={audioRef} />
        <div className="audio-meter-card">
          <div className="audio-meter-head"><strong>Microphone level</strong><span>{micStatus}</span></div>
          <div className="audio-meter-track"><div className="audio-meter-fill" style={{ width: `${micLevel}%` }} /></div>
          <p>{micOn ? "Speak now. The green bar should move if the microphone is working." : "Press Test Mic Only or Test Camera + Mic."}</p>
        </div>
      </Card>

      <div className="dashboard-grid">
        <Card><h2>Important limitations</h2><p>Device selection only works for devices that Safari/Chrome and the operating system expose to the browser.</p><p>Noise suppression, echo cancellation and auto gain are browser-level constraints; their effect is audible in real sound but may not visibly change the meter.</p><p>True background blur/replacement requires the LiveKit/WebRTC media-processor phase.</p></Card>
        <Card><h2>Detected Devices</h2>{devices.length ? <ul>{devices.map((device) => <li key={`${device.kind}-${device.id}`}>{device.kind}: {device.label}</li>)}</ul> : <p>No devices listed yet. Press Allow / Refresh Devices and allow permissions.</p>}</Card>
      </div>
    </div>
  );
}
