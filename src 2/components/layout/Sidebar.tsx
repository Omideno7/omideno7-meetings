import { appRoutes } from "../../config/routes";
import { canOpenRoute } from "../../services/routeGuard";
import { useAppState } from "../../app/AppState";
import type { AppRouteKey } from "../../types/routes";

const hiddenFromSidebar: AppRouteKey[] = ["landing", "login", "requestAccess", "pendingApproval", "liveMeeting"];

export function Sidebar() {
  const { profile, route, setRoute, logout } = useAppState();
  const visibleRoutes = appRoutes.filter((item) => !hiddenFromSidebar.includes(item.key) && canOpenRoute(item.key, profile));

  if (!profile) return null;

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/omideno7-logo.png" alt="OmideNo7" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        <div>
          <strong>OmideNo7 Meetings</strong>
          <span>{profile.displayName}</span>
        </div>
      </div>
      <nav>
        {visibleRoutes.map((item) => (
          <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => setRoute(item.key)}>
            {item.label}
          </button>
        ))}
      </nav>
      <button className="logout" onClick={logout}>Logout</button>
    </aside>
  );
}
