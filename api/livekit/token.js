import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const LIVEKIT_URL = process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_WS_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const hostRoles = new Set(["owner", "senior_host", "meeting_host", "co_host", "door_servant", "media_servant", "prayer_servant", "chat_moderator"]);

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function cleanText(value, fallback) {
  const text = String(value || fallback || "").trim();
  return text.replace(/[^a-zA-Z0-9._:@ -]/g, "").slice(0, 80) || fallback;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, reason: "method_not_allowed" });
  }

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return json(res, 500, { ok: false, reason: "livekit_env_missing" });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return json(res, 500, { ok: false, reason: "supabase_env_missing" });
  }

  const authHeader = req.headers.authorization || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    return json(res, 401, { ok: false, reason: "missing_supabase_session" });
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    body = {};
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  const user = userData?.user;

  if (userError || !user) {
    return json(res, 401, { ok: false, reason: "invalid_supabase_session" });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,display_name,full_name,role,status,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return json(res, 403, { ok: false, reason: "profile_not_found" });
  }

  if (profile.status !== "approved") {
    return json(res, 403, { ok: false, reason: "profile_not_approved" });
  }

  const isHost = hostRoles.has(profile.role);
  const meetingId = cleanText(body.meetingId, "main-room").toLowerCase().replace(/\s+/g, "-");
  const roomName = cleanText(body.roomName, `omideno7-${meetingId}`).toLowerCase().replace(/\s+/g, "-");

  if (!isHost) {
    const roomParticipantId = `${meetingId}::${user.id}`;
    const { data: row, error: waitingError } = await supabase
      .from("meeting_room_participants")
      .select("id,status")
      .eq("id", roomParticipantId)
      .maybeSingle();

    if (waitingError || !row || row.status !== "online") {
      return json(res, 403, {
        ok: false,
        reason: "waiting_room_admission_required",
        message: "Member must be admitted from Waiting Room before receiving a LiveKit token."
      });
    }
  }

  const deviceId = cleanText(body.deviceId, "device").replace(/\s+/g, "-");
  const identity = cleanText(`${user.id}:${deviceId}`, user.id);
  const displayName = cleanText(profile.display_name || profile.full_name || user.email, "OmideNo7 User");

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: displayName,
    metadata: JSON.stringify({
      profileId: user.id,
      role: profile.role,
      avatarUrl: profile.avatar_url || "",
      deviceId
    }),
    ttl: "2h"
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost
  });

  const jwtToken = await token.toJwt();

  return json(res, 200, {
    ok: true,
    token: jwtToken,
    wsUrl: LIVEKIT_URL,
    roomName,
    identity,
    isHost
  });
}
