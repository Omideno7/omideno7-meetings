import { fullBuildService } from "../../services/fullBuildService";

export function ModuleStatusGrid() {
  const modules = fullBuildService.listModules();

  return (
    <div className="module-status-grid">
      {modules.map((module) => (
        <article key={module.id} className={`module-card module-${module.status}`}>
          <div>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </div>
          <span>{module.status.replace("_", " ")}</span>
        </article>
      ))}
    </div>
  );
}
