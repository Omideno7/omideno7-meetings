import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { dataMode } from "../config/dataMode";
import {
  permissionFieldLabels,
  servantRoleOptions,
  supabaseAdminService,
  type PermissionInput,
  type PermissionTemplate,
  type ProfileRow
} from "../services/supabaseAdminService";
import type { UserRole } from "../types/roles";

const blankPermissions: Omit<PermissionInput, "name" | "role"> = {
  can_start_meeting: false,
  can_admit_waiting_room: false,
  can_reject_waiting_room: false,
  can_remove_participant: false,
  can_mute_participants: false,
  can_activate_lecture_mode: false,
  can_start_recording: false,
  can_view_limited_reports: false,
  can_view_full_reports: false,
  can_publish_recordings: false
};

function yes(value: boolean) {
  return value ? "✅" : "—";
}

function cloneTemplate(template: PermissionTemplate): PermissionInput {
  return {
    name: template.name,
    role: template.role,
    can_start_meeting: template.can_start_meeting,
    can_admit_waiting_room: template.can_admit_waiting_room,
    can_reject_waiting_room: template.can_reject_waiting_room,
    can_remove_participant: template.can_remove_participant,
    can_mute_participants: template.can_mute_participants,
    can_activate_lecture_mode: template.can_activate_lecture_mode,
    can_start_recording: template.can_start_recording,
    can_view_limited_reports: template.can_view_limited_reports,
    can_view_full_reports: template.can_view_full_reports,
    can_publish_recordings: template.can_publish_recordings
  };
}

type ActionKind = "idle" | "loading" | "success" | "error";

export function PermissionTemplatesPage() {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PermissionInput>>({});
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [message, setMessage] = useState("Ready");
  const [actionKind, setActionKind] = useState<ActionKind>("idle");
  const [loadingAction, setLoadingAction] = useState("");
  const [lastSavedTemplate, setLastSavedTemplate] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("approved_member");
  const [selectedTemplate, setSelectedTemplate] = useState("Approved Member Basic");

  const [customTemplate, setCustomTemplate] = useState<PermissionInput>({
    name: "Custom Servant Template",
    role: "door_servant",
    ...blankPermissions
  });

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId),
    [profiles, selectedProfileId]
  );

  function start(action: string, text: string) {
    setLoadingAction(action);
    setActionKind("loading");
    setMessage(text);
  }

  function done(text: string, savedName = "") {
    setLoadingAction("");
    setActionKind("success");
    setMessage(text);
    if (savedName) setLastSavedTemplate(savedName);
  }

  function fail(text: string) {
    setLoadingAction("");
    setActionKind("error");
    setMessage(text);
  }

  function label(action: string, normal: string, busy: string) {
    return loadingAction === action ? busy : normal;
  }

  async function load(show = true) {
    if (show) start("refresh", "Refreshing templates and profiles...");

    const templateResult = await supabaseAdminService.listTemplates();
    const profileResult = await supabaseAdminService.listProfiles();

    setTemplates(templateResult.data);
    setDrafts(Object.fromEntries(templateResult.data.map((template) => [template.id, cloneTemplate(template)])));
    setProfiles(profileResult.data.filter((item) => item.role !== "owner"));

    const error = templateResult.error || profileResult.error;
    if (error) {
      fail(`Supabase error: ${error}`);
      return;
    }

    if (show) {
      done(`Refresh complete. ${templateResult.data.length} templates loaded.`);
    } else {
      setLoadingAction("");
      setActionKind("idle");
      setMessage("Ready");
    }
  }

  async function seed() {
    start("seed", "Creating or repairing default templates...");
    const result = await supabaseAdminService.seedDefaultTemplates();

    if (result.error) {
      fail(`Seed failed: ${result.error}`);
      return;
    }

    const templateResult = await supabaseAdminService.listTemplates();
    const profileResult = await supabaseAdminService.listProfiles();

    setTemplates(templateResult.data);
    setDrafts(Object.fromEntries(templateResult.data.map((template) => [template.id, cloneTemplate(template)])));
    setProfiles(profileResult.data.filter((item) => item.role !== "owner"));

    const error = templateResult.error || profileResult.error;
    if (error) {
      fail(`Templates repaired, but reload failed: ${error}`);
      return;
    }

    done(`Default templates are ready. ${templateResult.data.length} templates loaded.`);
  }

  async function assign() {
    if (!selectedProfileId) {
      fail("Choose a profile first, then press Apply to Profile.");
      return;
    }

    start("assign", "Applying role and template to selected profile...");
    const result = await supabaseAdminService.assignProfileRole(selectedProfileId, selectedRole, selectedTemplate);

    if (result.error) {
      fail(`Apply failed: ${result.error}`);
      return;
    }

    await load(false);
    done(`Applied ${selectedRole.replaceAll("_", " ")} with "${selectedTemplate}" to ${selectedProfile?.email || "selected profile"}.`);
  }

  function updateDraft(id: string, field: keyof PermissionInput, value: boolean | string) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value }
    }));
    setActionKind("idle");
    setMessage("Unsaved changes. Press Save on this row.");
  }

  async function saveTemplate(id: string) {
    const draft = drafts[id];
    if (!draft) {
      fail("Template draft was not found.");
      return;
    }

    start(`save-${id}`, `Saving template "${draft.name}"...`);
    const result = await supabaseAdminService.upsertTemplate(draft);

    if (result.error) {
      fail(`Save failed: ${result.error}`);
      return;
    }

    const templateResult = await supabaseAdminService.listTemplates();
    if (templateResult.error) {
      fail(`Saved, but reload failed: ${templateResult.error}`);
      return;
    }

    setTemplates(templateResult.data);
    setDrafts(Object.fromEntries(templateResult.data.map((template) => [template.id, cloneTemplate(template)])));
    done(`Template saved: ${draft.name}`, draft.name);
  }

  function updateCustom(field: keyof PermissionInput, value: boolean | string) {
    setCustomTemplate((current) => ({ ...current, [field]: value }));
    setActionKind("idle");
    setMessage("Custom permission changed. Press Save Custom Template.");
  }

  function loadTemplateIntoCustom(template: PermissionTemplate) {
    const customName = `Custom - ${template.name}`;
    setCustomTemplate({ ...cloneTemplate(template), name: customName });
    setSelectedRole(template.role);
    setSelectedTemplate(template.name);
    done(`Template cloned into custom editor: ${customName}`);
  }

  async function saveCustomOnly() {
    const name = customTemplate.name.trim();
    if (!name) {
      fail("Custom template name is required.");
      return;
    }

    start("save-custom", `Saving custom template "${name}"...`);
    const result = await supabaseAdminService.upsertTemplate({ ...customTemplate, name });

    if (result.error) {
      fail(`Custom save failed: ${result.error}`);
      return;
    }

    const templateResult = await supabaseAdminService.listTemplates();
    if (templateResult.error) {
      fail(`Saved, but reload failed: ${templateResult.error}`);
      return;
    }

    setTemplates(templateResult.data);
    setDrafts(Object.fromEntries(templateResult.data.map((template) => [template.id, cloneTemplate(template)])));
    done(`Custom template saved: ${name}`, name);
  }

  async function createCustomAndAssign() {
    if (!selectedProfileId) {
      fail("Choose a profile first before using Save + Apply.");
      return;
    }

    const name = customTemplate.name.trim() || `Custom - ${selectedProfile?.email || "servant"}`;
    const finalTemplate: PermissionInput = { ...customTemplate, name, role: customTemplate.role };

    start("save-apply-custom", `Saving custom template and applying it to ${selectedProfile?.email || "selected profile"}...`);
    const result = await supabaseAdminService.createCustomTemplateAndAssign(selectedProfileId, finalTemplate);

    if (result.error) {
      fail(`Save + Apply failed: ${result.error}`);
      return;
    }

    await load(false);
    done(`Custom permissions saved and applied to ${selectedProfile?.email || "selected profile"}.`, name);
  }

  useEffect(() => {
    void load(false);
  }, []);

  const isBusy = Boolean(loadingAction);

  return (
    <div className="page-grid">
      <div className={`action-toast action-${actionKind}`}>
        <strong>{actionKind === "loading" ? "Working" : actionKind === "success" ? "Done" : actionKind === "error" ? "Error" : "Status"}</strong>
        <span>{message}</span>
      </div>

      <Card>
        <h1>Permission Templates</h1>
        <p>Templates are reusable permission presets. Owner can also edit each permission manually or create a custom template for one person.</p>
        <p className="small-note">Data mode: {dataMode}</p>
        <div className="button-row">
          <Button onClick={seed} disabled={isBusy}>{label("seed", "Seed / Repair Default Templates", "Repairing...")}</Button>
          <Button variant="secondary" onClick={() => load(true)} disabled={isBusy}>{label("refresh", "Refresh", "Refreshing...")}</Button>
        </div>
        <p className={`auth-message message-${actionKind}`}>{message}</p>
      </Card>

      <Card>
        <h2>Assign Role / Template to Profile</h2>
        <p>Apply to Profile means: save this role and template on a real user account.</p>
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
        <Button onClick={assign} disabled={isBusy}>{label("assign", "Apply to Profile", "Applying...")}</Button>
      </Card>

      <Card>
        <h2>Create Custom Permissions</h2>
        <p>Use this when a servant needs special permissions that are not exactly one of the default templates.</p>
        <div className="form-grid">
          <input value={customTemplate.name} onChange={(event) => updateCustom("name", event.target.value)} placeholder="Custom template name" />
          <select value={customTemplate.role} onChange={(event) => updateCustom("role", event.target.value as UserRole)}>
            {servantRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
        </div>
        <div className="permission-grid">
          {permissionFieldLabels.map((field) => (
            <label key={field.key} className="permission-check">
              <input
                type="checkbox"
                checked={Boolean(customTemplate[field.key])}
                onChange={(event) => updateCustom(field.key, event.target.checked)}
              />
              <span>
                <strong>{field.label}</strong>
                <small>{field.description}</small>
              </span>
            </label>
          ))}
        </div>
        <div className="button-row">
          <Button onClick={saveCustomOnly} disabled={isBusy}>{label("save-custom", "Save Custom Template", "Saving...")}</Button>
          <Button variant="secondary" onClick={createCustomAndAssign} disabled={isBusy}>{label("save-apply-custom", "Save + Apply to Selected Profile", "Saving + Applying...")}</Button>
        </div>
      </Card>

      <Card>
        <h2>Editable Template Matrix</h2>
        <p>You can change a template by ticking permissions and pressing Save. These changes are stored in Supabase.</p>
        <div className="table-wrap">
          <table className="admin-table permission-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Role</th>
                {permissionFieldLabels.map((field) => <th key={field.key}>{field.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const draft = drafts[template.id] || cloneTemplate(template);
                const rowSaved = lastSavedTemplate && lastSavedTemplate.toLowerCase() === draft.name.toLowerCase();

                return (
                  <tr key={template.id} className={rowSaved ? "row-saved" : ""}>
                    <td>
                      <input
                        className="table-input"
                        value={draft.name}
                        onChange={(event) => updateDraft(template.id, "name", event.target.value)}
                      />
                      {rowSaved && <small className="saved-label">Saved ✓</small>}
                    </td>
                    <td>
                      <select value={draft.role} onChange={(event) => updateDraft(template.id, "role", event.target.value as UserRole)}>
                        {servantRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                    </td>
                    {permissionFieldLabels.map((field) => (
                      <td key={field.key}>
                        <input
                          type="checkbox"
                          aria-label={field.label}
                          checked={Boolean(draft[field.key])}
                          onChange={(event) => updateDraft(template.id, field.key, event.target.checked)}
                        />
                      </td>
                    ))}
                    <td>
                      <div className="mini-actions">
                        <Button variant="secondary" onClick={() => saveTemplate(template.id)} disabled={isBusy}>
                          {label(`save-${template.id}`, "Save", "Saving...")}
                        </Button>
                        <Button variant="ghost" onClick={() => loadTemplateIntoCustom(template)} disabled={isBusy}>Clone</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2>Simple View</h2>
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
