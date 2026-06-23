import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../app/AppState";
import { dataMode } from "../config/dataMode";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { getRealMeetingReadiness } from "../services/realMeetingService";

const readinessGroups = [
  {
    title: "Ready for servant QA",
    items: [
      "Supabase Auth / approved user flow",
      "Owner approval panel",
      "Role and permission templates",
      "Meeting schedule and recurring meetings",
      "Waiting Room UI and live meeting integration",
      "Live Meeting UI controls, chat, reactions, mic control menus",
      "Profile edit and mobile gallery picker",
      "Media/device test panel",
      "Testing Center and issue report export"
    ]
  },
  {
    title: "Needs real production backend before public release",
    items: [
      "LiveKit token endpoint on secure server",
      "Real WebRTC audio/video rooms",
      "Live chat persistence and realtime delivery",
      "Real participant presence/reconnect events",
      "Recording pipeline to private storage",
      "Push notifications",
      "Final privacy policy and terms",
      "App Store / Google Play packaging"
    ]
  }
];

export function ReleaseReadinessPage() {
  const { setRoute } = useAppState();
  const liveKit = getRealMeetingReadiness();

  return (
    <div className="page-grid release-page">
      <Card>
        <h1>Release Readiness</h1>
        <p>This page separates what is ready for church servant testing from what still needs real backend/live video infrastructure.</p>
        <div className="button-row">
          <Button onClick={() => setRoute("testingCenter")}>Open Testing Center</Button>
          <Button variant="secondary" onClick={() => setRoute("liveKitSetup")}>LiveKit Setup</Button>
          <Button variant="secondary" onClick={() => setRoute("securityCenter")}>Security Center</Button>
        </div>
      </Card>

      <div className="dashboard-grid">
        <Card>
          <h2>Current environment</h2>
          <div className="info-grid">
            <span>Data mode</span><strong>{dataMode}</strong>
            <span>Supabase</span><strong>{isSupabaseConfigured ? "configured" : "not configured"}</strong>
            <span>LiveKit mode</span><strong>{liveKit.mode}</strong>
            <span>LiveKit configured</span><strong>{liveKit.configured ? "yes" : "not yet"}</strong>
          </div>
        </Card>
        <Card>
          <h2>Next test goal</h2>
          <p>Run one complete servant test meeting. Collect issues in Testing Center. Then fix only verified bugs from the exported report.</p>
        </Card>
      </div>

      <div className="readiness-columns">
        {readinessGroups.map((group) => (
          <Card key={group.title}>
            <h2>{group.title}</h2>
            <ul className="release-list">
              {group.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <h2>Decision</h2>
        <p><strong>Use this build for internal servant testing.</strong> Do not use it yet for high-risk public member meetings until LiveKit real backend and production security review are complete.</p>
      </Card>
    </div>
  );
}
