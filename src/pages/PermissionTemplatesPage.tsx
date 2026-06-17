import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { dataMode } from "../config/dataMode";
import { servantRoleOptions, supabaseAdminService, type PermissionTemplate, type ProfileRow } from "../services/supabaseAdminService";
import type { UserRole } from "../types/roles";

function yes(value: boolean) {
  return value ? "✅" : "—";
}

export function PermissionTemplatesPage() {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("approved_member");
  const [selectedTemplate, setSelectedTemplate] = useState("Approved Member Basic");

  async function load() {
    setLoading(true);
    setMessage("");

    const templateResult = await supabaseAdminService.listTemplates();
    const profileResult = await supabaseAdminService.listProfiles();

    setTemplates(templateResult.data);
    setProfiles(profileResult.data.filter((item) => item.role !== "owner"));
    setMessage(templateResult.error || profileResult.error || "");
    setLoading(false);
  }

  async function seed() {
    setLoading(true);
    const result = await supabaseAdminService.seedDefaultTemplates();
    setMessage(result.error || "Default permission templates are ready.");
    await load();
    setLoading(false);
  }

  async function assign() {
    if (!selectedProfileId) {
      setMessage("Choose a profile first.");
      return;
    }
    setLoading(true);
    const result = await supabaseAdminService.assignProfileRole(selectedProfileId, selectedRole, selectedTemplate);
    setMessage(result.error || "Role and permission template assigned.");
    await load();
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page-grid">
      <Card>
        <h1>Permission Templates</h1>
        <p>Owner can prepare reusable permission presets for servants and apply them per servant account.</p>
        <p className="small-note">Data mode: {dataMode}</p>
        <div className="button-row">
          <Button onClick={seed} disabled={loading}>Seed Default Templates</Button>
          <Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
        </div>
        {message && <p className="auth-message">{message}</p>}
      </Card>

      <Card>
        <h2>Assign Role / Template</h2>
        <div className="form-grid">
          <select value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)}>
            <option value="">Choose approved profile</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.display_name || profile.full_name || profile.email} — {profile.email} — {profile.role}</option>
            ))}
          </select>
          <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as UserRole)}>
            {servantRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
          <select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)}>
            {templates.map((template) => <option key={template.id} value={template.name}>{template.name}</option>)}
          </select>
        </div>
        <Button onClick={assign} disabled={loading}>Apply to Profile</Button>
      </Card>

      <Card>
        <h2>Templates Matrix</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Role</th>
                <th>Start</th>
                <th>Admit</th>
                <th>Remove</th>
                <th>Lecture</th>
                <th>Record</th>
                <th>Reports</th>
                <th>Publish</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>{template.name}</td>
                  <td>{template.role.replaceAll("_", " ")}</td>
                  <td>{yes(template.can_start_meeting)}</td>
                  <td>{yes(template.can_admit_waiting_room)}</td>
                  <td>{yes(template.can_remove_participant)}</td>
                  <td>{yes(template.can_activate_lecture_mode)}</td>
                  <td>{yes(template.can_start_recording)}</td>
                  <td>{yes(template.can_view_full_reports || template.can_view_limited_reports)}</td>
                  <td>{yes(template.can_publish_recordings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
