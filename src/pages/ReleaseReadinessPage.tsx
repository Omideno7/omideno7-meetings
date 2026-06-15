import { Card } from "../components/ui/Card";
import { ReleaseReadinessPanel } from "../components/ui/ReleaseReadinessPanel";

export function ReleaseReadinessPage() {
  return (
    <div className="page-grid">
      <Card>
        <h1>Release Readiness</h1>
        <p>Final checklist before real member use, Google Play, App Store, and production release.</p>
      </Card>
      <ReleaseReadinessPanel />
    </div>
  );
}
