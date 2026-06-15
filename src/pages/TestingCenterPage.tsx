import { Card } from "../components/ui/Card";
import { TestingCenterPanel } from "../components/ui/TestingCenterPanel";

export function TestingCenterPage() {
  return (
    <div className="page-grid">
      <Card>
        <h1>Testing Center</h1>
        <p>After the full app structure is uploaded, use this Owner-only center to test every part stage by stage.</p>
      </Card>
      <TestingCenterPanel />
    </div>
  );
}
