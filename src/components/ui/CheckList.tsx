import { demoStore } from "../../services/demoStore";
import { useDemoStoreVersion } from "../../hooks/useDemoStoreVersion";

export function CheckList() {
  useDemoStoreVersion();
  const items = demoStore.getChecklist();

  return (
    <div className="interactive-checklist">
      {items.map((item) => (
        <button key={item.id} onClick={() => demoStore.toggleChecklist(item.id)}>
          <span>{item.checked ? "☑" : "☐"}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
