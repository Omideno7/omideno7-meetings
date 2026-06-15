import { deploymentChecklist } from "../../config/deploymentChecklist";

export function DeploymentChecklistPanel() {
  return (
    <div className="deploy-checklist-grid">
      {deploymentChecklist.map((section) => (
        <section key={section.title} className="deploy-checklist-card">
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <li key={item}><span>□</span>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
