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

const coreTemplates = [
  "Approved Member Basic",
  "Senior Host Full Meeting Control",
  "Meeting Host Standard",
  "Co-host Lecture Assistant",
  "Door Servant Waiting Room",
  "Media Servant Recording",
  "Prayer Servant Support",
  "Chat Moderator"
];

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

function isCore(name: string) {
  return coreTemplates.some((item) => item.toLowerCase() === name.toLowerCase());
}

type Toast = { kind: "idle" | "loading" | "success" | "error"; text: string };

export function PermissionTemplatesPage() {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PermissionInput>>({});
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [toast, setToast] = useState<Toast>({ kind: "idle", text: "Ready" });
  const [loadingAction, setLoadingAction] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("approved_member");
  const [selectedTemplate, setSelectedTemplate] = useState("Approved Member Basic");
  const [customTemplate, setCustomTemplate] = useState<PermissionInput>({
    name: "Custom Servant Template",
    role: "door_servant",
    ...blankPermissions
  });

  const selectedProfile = useMemo(() => profiles.find((profile) => profile.id === selectedProfileId), [profiles, selectedProfileId]);
  const isBusy = Boolean(loadingAction);

  useEffect(() => {
    if (toast.kind === "success" || toast.kind === "error") {
      const timer = window.setTimeout(() => setToast({ kind: "idle", text: "Ready" }), 4500);
      return () => window.clearTimeout(timer);
    }
  }, [toast.kind, toast.text]);

  function show(kind: Toast["kind"], text: string, action = "") {
    setToast({ kind, text });
    setLoadingAction(action);
  }

  function label(action: string, normal: string, busy: string) {
    return loadingAction === action ? busy : normal;
  }

  async function load(showFeedback = true) {
    if (showFeedback) show("loading", "Refreshing templates and profiles...", "refresh");
    const templateResult = await supabaseAdminService.listTemplates();
    const profileResult = await supabaseAdminService.listProfiles();

    setTemplates(templateResult.data);
    setDrafts(Object.fromEntries(templateResult.data.map((template) => [template.id, cloneTemplate(template)])));
    setProfiles(profileResult.data.filter((item) => item.role !== "owner"));

    const error = templateResult.error || profileResult.error;
    if (error) {
      show("error", `Supabase error: ${error}`);
      return;
    }
    show(showFeedback ? "success" : "idle", showFeedback ? `Loaded ${templateResult.data.length} templates.` : "Ready");
  }

  async function seed() {
    show("loading", "Creating or repairing default templates...", "seed");
    const result = await supabaseAdminService.seedDefaultTemplates();
    if (result.error) {
      show("error", `Seed failed: ${result.error}`);
      return;
    }
    await load(false);
    show("success", "Default templates are ready and duplicates are prevented.");
  }

  async function assign() {
    if (!selectedProfileId) {
      show("error", "Choose a profile first.");
      return;
    }
    show("loading", "Applying role/template to selected profile...", "assign");
    const result = await supabaseAdminService.assignProfileRole(selectedProfileId, selectedRole, selectedTemplate);
    if (result.error) {
      show("error", `Apply failed: ${result.error}`);
      return;
    }
    await load(false);
    show("success", `Applied ${selectedRole.replaceAll("_", " ")} to ${selectedProfile?.email || "selected profile"}.`);
  }

  function updateDraft(id: string, field: keyof PermissionInput, value: boolean | string) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
    show("idle", "Unsaved changes. Press Save on this row.");
  }

  async function saveTemplate(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    show("loading", `Saving "${draft.name}"...`, `save-${id}`);
    const result = await supabaseAdminService.upsertTemplate(draft);
    if (result.error) {
      show("error", `Save failed: ${result.error}`);
      return;
    }
    await load(false);
    show("success", `Template saved: ${draft.name}`);
  }

  function updateCustom(field: keyof PermissionInput, value: boolean | string) {
    setCustomTemplate((current) => ({ ...current, [field]: value }));
    show("idle", "Custom permissions changed. Press Save Custom Template.");
  }

  async function saveCustomOnly() {
    const name = customTemplate.name.trim();
    if (!name) {
      show("error", "Custom template name is required.");
      return;
    }
    show("loading", `Saving custom template "${name}"...`, "save-custom");
    const result = await supabaseAdminService.upsertTemplate({ ...customTemplate, name });
    if (result.error) {
      show("error", `Custom save failed: ${result.error}`);
      return;
    }
    await load(false);
    show("success", `Custom template saved: ${name}`);
  }

  async function createCustomAndAssign() {
    if (!selectedProfileId) {
      show("error", "Choose a profile first.");
      return;
    }
    const name = customTemplate.name.trim() || `Custom - ${selectedProfile?.email || "servant"}`;
    show("loading", "Saving custom template and applying it...", "save-apply-custom");
    const result = await supabaseAdminService.createCustomTemplateAndAssign(selectedProfileId, { ...customTemplate, name });
    if (result.error) {
      show("error", `Save + Apply failed: ${result.error}`);
      return;
    }
    await load(false);
    show("success", `Custom permissions saved and applied to ${selectedProfile?.email || "selected profile"}.`);
  }

  function cloneIntoCustom(template: PermissionTemplate) {
    setCustomTemplate({ ...cloneTemplate(template), name: `Custom - ${template.name}` });
    show("success", `Cloned "${template.name}" into custom editor.`);
  }

  async function deleteTemplate(template: PermissionTemplate) {
    if (isCore(template.name)) {
      show("error", "Core/default templates are protected. Clone it first, then delete the custom clone if needed.");
      return;
    }
    const ok = window.confirm(`Delete template "${template.name}"? This cannot be undone.`);
    if (!ok) return;
    show("loading", `Deleting "${template.name}"...`, `delete-${template.id}`);
    const result = await supabaseAdminService.deletePermissionTemplate(template.id);
    if (result.error) {
      show("error", `Delete failed: ${result.error}`);
      return;
    }
    await load(false);
    show("success", `Template deleted: ${template.name}`);
  }

  async function deleteTestTemplates() {
    const candidates = templates.filter((template) =>
      !isCore(template.name) &&
      (template.name.toLowerCase().includes("test") || template.name.toLowerCase().includes("custom"))
    );
    if (!candidates.length) {
      show("error", "No custom/test templates found to delete.");
      return;
    }
    const ok = window.confirm(`Delete ${candidates.length} custom/test templates? Core templates will be protected.`);
    if (!ok) return;
    show("loading", "Deleting custom/test templates...", "delete-tests");
    for (const template of candidates) {
      await supabaseAdminService.deletePermissionTemplate(template.id);
    }
    await load(false);
    show("success", `${candidates.length} custom/test templates deleted.`);
  }

  useEffect(() => {
    void load(false);
  }, []);

  return (
    <div className="page-grid">
      <div className={`action-toast action-${toast.kind}`}>
        <strong>{toast.kind === "loading" ? "Working" : toast.kind === "success" ? "Done" : toast.kind === "error" ? "Error" : "Status"}</strong>
        <span>{toast.text}</span>
        <button className="toast-close" onClick={() => setToast({ kind: "idle", text: "Ready" })}>×</button>
      </div>

      <Card>
        <h1>Permission Templates</h1>
        <p>Templates are reusable permission presets. Owner can edit each permission manually or create a custom template for one person.</p>
        <p className="small-note">Data mode: {dataMode}</p>
        <div className="button-row">
          <Button onClick={seed} disabled={isBusy}>{label("seed", "Seed / Repair Default Templates", "Repairing...")}</Button>
          <Button variant="secondary" onClick={() => load(true)} disabled={isBusy}>{label("refresh", "Refresh", "Refreshing...")}</Button>
          <Button variant="danger" onClick={deleteTestTemplates} disabled={isBusy}>{label("delete-tests", "Delete Test / Custom Templates", "Deleting...")}</Button>
        </div>
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
        <p>Default/core templates are protected from accidental deletion. Clone them if you need a custom version.</p>
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
                const protectedRow = isCore(template.name);
                return (
                  <tr key={template.id}>
                    <td><input className="table-input" value={draft.name} onChange={(event) => updateDraft(template.id, "name", event.target.value)} /></td>
                    <td>
                      <select value={draft.role} onChange={(event) => updateDraft(template.id, "role", event.target.value as UserRole)}>
                        {servantRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                    </td>
                    {permissionFieldLabels.map((field) => (
                      <td key={field.key}>
                        <input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => updateDraft(template.id, field.key, event.target.checked)} />
                      </td>
                    ))}
                    <td>
                      <div className="mini-actions">
                        <Button variant="secondary" onClick={() => saveTemplate(template.id)} disabled={isBusy}>{label(`save-${template.id}`, "Save", "Saving...")}</Button>
                        <Button variant="ghost" onClick={() => cloneIntoCustom(template)} disabled={isBusy}>Clone</Button>
                        <Button variant={protectedRow ? "ghost" : "danger"} onClick={() => deleteTemplate(template)} disabled={isBusy}>{protectedRow ? "Protected" : label(`delete-${template.id}`, "Delete", "Deleting...")}</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
