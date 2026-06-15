import { Card } from "../components/ui/Card";
import { DeploymentChecklistPanel } from "../components/ui/DeploymentChecklistPanel";

export function DeployTestPage() {
  return (
    <div className="page-grid">
      <Card>
        <h1>Deploy Test Version</h1>
        <p>This page summarizes the steps for deploying the installable PWA test version to HTTPS hosting.</p>
      </Card>
      <DeploymentChecklistPanel />
      <Card>
        <h2>Recommended first deploy</h2>
        <p>Use Vercel or Netlify first because they are fastest for a Vite + React test build. After deployment, open the HTTPS link on iPhone Safari or Android Chrome and install the app.</p>
      </Card>
    </div>
  );
}
