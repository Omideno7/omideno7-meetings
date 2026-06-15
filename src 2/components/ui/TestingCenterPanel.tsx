import { fullBuildService } from "../../services/fullBuildService";
import { useDemoStoreVersion } from "../../hooks/useDemoStoreVersion";

export function TestingCenterPanel() {
  useDemoStoreVersion();
  const items = fullBuildService.listTestingItems();

  return (
    <div className="testing-list">
      {items.map((item: any) => (
        <article key={item.id} className={`testing-item testing-${item.status}`}>
          <div>
            <strong>{item.section}</strong>
            <p>{item.item}</p>
          </div>
          <div className="button-row">
            <button onClick={() => fullBuildService.updateTestingItem(item.id, "passed")}>Passed</button>
            <button onClick={() => fullBuildService.updateTestingItem(item.id, "failed")}>Failed</button>
            <button onClick={() => fullBuildService.updateTestingItem(item.id, "needs_fix")}>Needs Fix</button>
          </div>
        </article>
      ))}
    </div>
  );
}
