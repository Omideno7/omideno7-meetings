import { fullBuildService } from "../../services/fullBuildService";
import { useDemoStoreVersion } from "../../hooks/useDemoStoreVersion";

export function ReleaseReadinessPanel() {
  useDemoStoreVersion();
  const items = fullBuildService.listReleaseItems();

  return (
    <div className="release-list">
      {items.map((item: any) => (
        <article key={item.title} className={`release-item release-${item.status}`}>
          <div>
            <strong>{item.category}</strong>
            <p>{item.title}</p>
          </div>
          <div className="button-row">
            <button onClick={() => fullBuildService.updateReleaseItem(item.title, "ready")}>Ready</button>
            <button onClick={() => fullBuildService.updateReleaseItem(item.title, "pending")}>Pending</button>
          </div>
        </article>
      ))}
    </div>
  );
}
