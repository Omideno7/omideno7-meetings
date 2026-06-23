import { useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import type { UserProfile } from "../../types/roles";
import { liveKitTokenService, type LiveKitTokenResponse } from "../../services/liveKitTokenService";
import { liveKitReadyConfig } from "../../config/liveKitReady";

type Props = {
  profile: UserProfile | null;
  admitted: boolean;
  meetingId: string;
  onConnectionChange?: (connected: boolean) => void;
};

export function RealLiveKitRoom({ profile, admitted, meetingId, onConnectionChange }: Props) {
  const [status, setStatus] = useState("Not connected");
  const [tokenData, setTokenData] = useState<Extract<LiveKitTokenResponse, { ok: true }> | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function connectRealRoom() {
    setConnecting(true);
    setStatus("Requesting secure LiveKit token...");

    const result = await liveKitTokenService.requestToken({ meetingId, profile, admitted });
    setConnecting(false);

    if (!result.ok) {
      setStatus(result.message || `Cannot connect: ${result.reason}`);
      onConnectionChange?.(false);
      return;
    }

    setTokenData(result);
    onConnectionChange?.(true);
    setStatus(`Live video room is ready: ${result.roomName}`);
  }

  function disconnectRealRoom() {
    setTokenData(null);
    onConnectionChange?.(false);
    setStatus("Disconnected from real LiveKit room.");
  }

  return (
    <section className={`real-livekit-card integrated-livekit-card ${tokenData ? "connected" : "not-connected"}`}>
      <div className="real-livekit-head">
        <div>
          <strong>{tokenData ? "LiveKit Video Grid" : "Real LiveKit Room"}</strong>
          <span>
            {tokenData
              ? "Camera tiles are now inside the meeting grid. Turn camera on to show live video."
              : "Join to replace profile tiles with real video tiles."}
          </span>
        </div>
        <div className="real-livekit-actions">
          {!tokenData ? (
            <button onClick={connectRealRoom} disabled={connecting || !admitted}>
              {connecting ? "Connecting..." : "Join Real Room"}
            </button>
          ) : (
            <button className="danger" onClick={disconnectRealRoom}>Close Real Room</button>
          )}
        </div>
      </div>

      {!admitted && (
        <div className="real-livekit-warning">
          Member must be admitted from Waiting Room before receiving a LiveKit token.
        </div>
      )}

      <p className="real-livekit-status">{status}</p>

      {tokenData && (
        <div className="real-livekit-frame integrated-video-frame">
          <LiveKitRoom
            token={tokenData.token}
            serverUrl={tokenData.wsUrl || liveKitReadyConfig.wsUrl}
            connect={true}
            audio={true}
            video={true}
            onDisconnected={() => {
              setStatus("Disconnected from LiveKit.");
              setTokenData(null);
              onConnectionChange?.(false);
            }}
            onError={(error) => setStatus(error.message)}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      )}
    </section>
  );
}
