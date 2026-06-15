import { Card } from "../components/ui/Card";
import { ModuleStatusGrid } from "../components/ui/ModuleStatusGrid";
import { fullBuildService } from "../services/fullBuildService";

export function FullBuildOverviewPage() {
  const summary = fullBuildService.getCompletionSummary();

  return (
    <div className="page-grid">
      <Card>
        <h1>Full Build Overview</h1>
        <p>Steps 21 to 30 are prepared in one upload package. Real credentials are still required for Supabase and LiveKit.</p>
      </Card>
      <div className="report-grid">
        <Card><h2>{summary.total}</h2><p>Total modules</p></Card>
        <Card><h2>{summary.ready}</h2><p>Prepared modules</p></Card>
        <Card><h2>{summary.needsCredentials}</h2><p>Need credentials</p></Card>
      </div>
      <ModuleStatusGrid />
    </div>
  );
}
