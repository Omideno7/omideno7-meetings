import { Card } from "../components/ui/Card";

export function LegalPagesSetupPage() {
  return (
    <div className="page-grid">
      <Card>
        <h1>Legal Pages Setup</h1>
        <p>Prepare Privacy Policy, Terms of Use, and Account Deletion instructions before public release.</p>
      </Card>
      <Card>
        <h2>Privacy Policy</h2>
        <p>Must explain account data, access approval, meeting attendance, recordings, messages, reports, and deletion requests.</p>
      </Card>
      <Card>
        <h2>Terms of Use</h2>
        <p>Must explain approved access, respectful meeting behavior, recording rules, and church ownership of meetings/archives.</p>
      </Card>
      <Card>
        <h2>Account Deletion</h2>
        <p>Users must know how to request deletion of their account and personal data.</p>
      </Card>
    </div>
  );
}
