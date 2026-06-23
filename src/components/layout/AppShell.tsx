import { useAppState } from "../../app/AppState";
import { canOpenRoute } from "../../services/routeGuard";
import type { AppRouteKey } from "../../types/routes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, route, setRoute, logout } = useAppState();

  const mainTabs: { key: AppRouteKey; label: string; icon: string }[] = [
    { key: "memberHome", label: "Home", icon: "⌂" },
    { key: "meetingSchedule", label: "Meetings", icon: "◷" },
    { key: "liveMeeting", label: "Live", icon: "▣" },
    { key: "waitingRoom", label: "Waiting", icon: "⏳" },
    { key: "deviceTest", label: "Media", icon: "🎙" },
    { key: "profile", label: "Profile", icon: "◉" },
    { key: "servantDashboard", label: "Host", icon: "◎" },
    { key: "reports", label: "Reports", icon: "📊" },
    { key: "ownerDashboard", label: "Owner", icon: "✓" },
    { key: "testingCenter", label: "Testing", icon: "🧪" },
    { key: "releaseReadiness", label: "Release", icon: "🚦" }
  ];

  const visibleTabs = mainTabs.filter((item) => canOpenRoute(item.key, profile));

  return (
    <div className="app-shell no-sidebar-shell">
      <header className="top-app-nav">
        <div className="top-brand">
          <img src="/omideno7-logo.png" alt="OmideNo7" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <div>
            <strong>OmideNo7 Meetings</strong>
            <span>{profile?.displayName} · {profile?.status}</span>
          </div>
        </div>

        <nav>
          {visibleTabs.map((item) => (
            <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => setRoute(item.key)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button className="top-logout" onClick={logout}>Logout</button>
      </header>

      <main className="main-content full-main-content">{children}</main>

      <nav className="mobile-bottom-tabs" aria-label="Main mobile navigation">
        {visibleTabs.slice(0, 5).map((item) => (
          <button key={item.key} className={route === item.key ? "active" : ""} onClick={() => setRoute(item.key)}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
