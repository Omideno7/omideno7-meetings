import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { demoStore } from "../services/demoStore";
import { useDemoStoreVersion } from "../hooks/useDemoStoreVersion";
import { CheckList } from "../components/ui/CheckList";

export function NotificationsPage() {
  useDemoStoreVersion();
  const notifications = demoStore.listNotifications();
  return <div className="page-grid"><Card><h1>Notifications</h1><p>In-app notifications, badges, waiting room alerts, access request alerts, and owner broadcasts.</p><Button onClick={() => demoStore.markAllNotificationsRead()}>Mark All Read</Button></Card>{notifications.map((item) => <Card key={item.id} className={item.read ? "muted-card" : "highlight-card"}><div className="section-row"><div><h2>{item.title}</h2><p>{item.body}</p><small>{item.type} · {item.createdAt}</small></div>{!item.read && <Button onClick={() => demoStore.markNotificationRead(item.id)}>Read</Button>}</div></Card>)}</div>;
}

export function InboxPage() {
  useDemoStoreVersion();
  const messages = demoStore.listInbox();
  return <div className="page-grid"><Card><h1>Inbox</h1><p>Messages from Apostle Yuhana and system notices.</p></Card>{messages.map((message: any) => <Card key={message.id} className={message.read ? "muted-card" : "highlight-card"}><div className="section-row"><div><h2>{message.subject}</h2><p><b>From:</b> {message.from}</p><p>{message.body}</p></div>{!message.read && <Button onClick={() => demoStore.markInboxRead(message.id)}>Mark Read</Button>}</div></Card>)}</div>;
}

export function MediaLibraryPage() {
  const recordings = [
    { title: "Sunday Service — Demo Recording", type: "MP4 + MP3", status: "Owner only", note: "Includes transcript and subtitles placeholder." },
    { title: "Morning Prayer — Demo Audio", type: "MP3", status: "Published to members", note: "Audio-only archive example." },
    { title: "Teaching Class — Transcript", type: "Transcript + SRT", status: "Review needed", note: "Owner must review before publishing." }
  ];
  return <div className="page-grid"><Card><h1>Media Library</h1><p>Recordings, MP4, MP3, transcript, SRT, VTT and publishing controls.</p></Card>{recordings.map((item) => <Card key={item.title}><h2>{item.title}</h2><p>{item.type} · {item.status}</p><p>{item.note}</p><div className="button-row"><Button variant="secondary">Preview</Button><Button variant="secondary">Download</Button><Button>Publish Demo</Button></div></Card>)}</div>;
}

export function ReportsPage() {
  const rows = [["Apostle Yuhana", "Owner", "82 min", "0", "excellent"], ["Mary Smith", "Member", "76 min", "1", "good"], ["David Brown", "Media Servant", "15 min", "4", "poor"]];
  return <div className="page-grid"><Card><h1>Reports</h1><p>Attendance, duration, reconnects, connection quality, exports and analytics.</p></Card><div className="report-grid"><Card><h2>128</h2><p>Total participants</p></Card><Card><h2>68 min</h2><p>Average duration</p></Card><Card><h2>31</h2><p>Reconnect total</p></Card><Card><h2>9</h2><p>Poor connections</p></Card></div><Card><h2>Attendance Table</h2><div className="responsive-table"><table><thead><tr><th>Name</th><th>Role</th><th>Duration</th><th>Reconnect</th><th>Quality</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div><div className="button-row"><Button variant="secondary">Export CSV</Button><Button variant="secondary">Export JSON</Button><Button variant="secondary">Prepare PDF</Button></div></Card></div>;
}

export function SystemSetupPage() {
  return <div className="page-grid"><Card><h1>System Setup</h1><p>Owner-only environment and backend setup status.</p></Card><div className="dashboard-grid"><Card><h2>Supabase</h2><p>Not connected yet. Schema and RLS are prepared for next backend phase.</p></Card><Card><h2>LiveKit</h2><p>Not connected yet. Token endpoint architecture is prepared.</p></Card><Card><h2>Owner</h2><p>Apostle Yuhana</p></Card><Card><h2>PWA</h2><p>Installed test version is active.</p></Card></div></div>;
}

export function LiveKitSetupPage() {
  return <div className="page-grid"><Card><h1>LiveKit Setup</h1><p>Secure token endpoint, waiting room admission, recording and low bandwidth architecture.</p></Card><Card><h2>Token Rule</h2><p>Token must only be generated server-side after approved profile and Waiting Room admission.</p></Card><Card><h2>Default Privacy</h2><p>Mic Off and Camera Off by default. Host cannot turn camera on without consent.</p></Card></div>;
}

export function ProductionRoadmapPage() {
  const phases = ["Prototype installed as PWA", "Mobile UI polish", "Supabase Auth connection", "Owner Approval backend", "LiveKit token server", "Closed testing", "Store packaging"];
  return <div className="page-grid"><Card><h1>Production Roadmap</h1><p>Prototype → React conversion → Supabase → LiveKit → testing → store release.</p></Card>{phases.map((phase, index) => <Card key={phase}><h2>Phase {index + 1}</h2><p>{phase}</p></Card>)}</div>;
}

export function PrototypeAuditPage() {
  return <div className="page-grid"><Card><h1>Prototype Audit</h1><p>Step 16A passed and Step 19 adds functional demo behavior.</p></Card><div className="dashboard-grid"><Card><h2>0</h2><p>Missing required files</p></Card><Card><h2>0</h2><p>Duplicate routes</p></Card><Card><h2>Ready</h2><p>PWA deployment</p></Card><Card><h2>Pending</h2><p>Backend connection</p></Card></div></div>;
}

export function SecurityTestPlanPage() {
  const tests = ["Pending user cannot see meetings", "Member cannot open Owner pages", "Waiting Room cannot be bypassed", "LiveKit token cannot be generated in frontend", "Recording links are private by default"];
  return <div className="page-grid"><Card><h1>Security Test Plan</h1><p>Owner-only security test list before release.</p></Card>{tests.map((test) => <Card key={test}><h2>Security Test</h2><p>□ {test}</p></Card>)}</div>;
}

export function DeployTestPage() {
  return <div className="page-grid"><Card><h1>Deploy Test Version</h1><p>Deployment checklist for HTTPS PWA testing.</p></Card><Card><h2>Interactive checklist</h2><p>Tap each item to mark/unmark it.</p><CheckList /></Card><Card><h2>Do not test as production</h2><p>Supabase, LiveKit and push notifications are still not connected.</p></Card></div>;
}
