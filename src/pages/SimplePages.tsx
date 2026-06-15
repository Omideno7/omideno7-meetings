import { Card } from "../components/ui/Card";

export function NotificationsPage() { return <Card><h1>Notifications</h1><p>In-app notifications, badges, waiting room alerts, access request alerts, and owner broadcasts.</p></Card>; }
export function InboxPage() { return <Card><h1>Inbox</h1><p>Messages from Apostle Yuhana and system notices.</p></Card>; }
export function MediaLibraryPage() { return <Card><h1>Media Library</h1><p>Recordings, MP4, MP3, transcript, SRT, VTT and publishing controls.</p></Card>; }
export function ReportsPage() { return <Card><h1>Reports</h1><p>Attendance, duration, reconnects, connection quality, exports and analytics.</p></Card>; }
export function LiveKitSetupPage() { return <Card><h1>LiveKit Setup</h1><p>Secure token endpoint, waiting room admission, recording and low bandwidth architecture.</p></Card>; }
export function ProductionRoadmapPage() { return <Card><h1>Production Roadmap</h1><p>Prototype → React conversion → Supabase → LiveKit → testing → store release.</p></Card>; }
export function PrototypeAuditPage() { return <Card><h1>Prototype Audit</h1><p>Step 16A passed: missing required files 0, duplicate routes 0, duplicate templates 0.</p></Card>; }
export function SecurityTestPlanPage() { return <Card><h1>Security Test Plan</h1><p>Owner-only pages, RLS, token server, waiting room, secret protection, recordings and reports must be tested before release.</p></Card>; }
